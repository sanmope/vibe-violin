/**
 * MusicXML Parser
 * Parses MusicXML files using the browser's native DOMParser.
 * Extracts title, composer, key/time signature, tempo, and notes.
 */

import type { SheetMusic, Note, NoteDuration } from '@/types';
import { findBestViolinPosition } from './noteConverter';

interface ParsedMusicXML {
  title: string;
  composer: string;
  keySignature: string;
  timeSignature: string;
  tempo: number;
  notes: Note[];
}

/** Map MusicXML duration type strings to our NoteDuration */
const MUSICXML_DURATION_MAP: Record<string, NoteDuration> = {
  'whole': 'whole',
  'half': 'half',
  'quarter': 'quarter',
  'eighth': 'eighth',
  '16th': 'sixteenth',
  '32nd': 'thirty-second',
};

/** Duration in beats for each NoteDuration in 4/4 time */
const DURATION_BEATS: Record<NoteDuration, number> = {
  'whole': 4,
  'half': 2,
  'quarter': 1,
  'eighth': 0.5,
  'sixteenth': 0.25,
  'thirty-second': 0.125,
};

/** Map MusicXML fifths value to key name */
const FIFTHS_TO_KEY: Record<number, string> = {
  '-7': 'Cb major', '-6': 'Gb major', '-5': 'Db major',
  '-4': 'Ab major', '-3': 'Eb major', '-2': 'Bb major',
  '-1': 'F major', '0': 'C major', '1': 'G major',
  '2': 'D major', '3': 'A major', '4': 'E major',
  '5': 'B major', '6': 'F# major', '7': 'C# major',
};

/**
 * Parse a MusicXML string into structured music data
 */
export function parseMusicXML(xmlString: string): ParsedMusicXML {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid MusicXML file: ' + parseError.textContent);
  }

  const title = extractTitle(doc);
  const composer = extractComposer(doc);
  const keySignature = extractKeySignature(doc);
  const timeSignature = extractTimeSignature(doc);
  const tempo = extractTempo(doc);
  const notes = extractNotes(doc, timeSignature);

  return { title, composer, keySignature, timeSignature, tempo, notes };
}

/**
 * Parse a MusicXML file into a SheetMusic object ready for the app
 */
export function parseMusicXMLToSheetMusic(xmlString: string, fileTitle?: string): { sheetMusic: SheetMusic; notes: Note[] } {
  const parsed = parseMusicXML(xmlString);

  const id = `musicxml-${Date.now()}`;
  const sheetMusic: SheetMusic = {
    id,
    title: parsed.title || fileTitle || 'Untitled',
    composer: parsed.composer || 'Unknown',
    keySignature: parsed.keySignature,
    timeSignature: parsed.timeSignature,
    tempo: parsed.tempo,
    status: 'READY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: parsed.notes,
  };

  return { sheetMusic, notes: parsed.notes };
}

function extractTitle(doc: Document): string {
  // Try work-title first, then movement-title
  const workTitle = doc.querySelector('work-title');
  if (workTitle?.textContent) return workTitle.textContent.trim();

  const movementTitle = doc.querySelector('movement-title');
  if (movementTitle?.textContent) return movementTitle.textContent.trim();

  return '';
}

function extractComposer(doc: Document): string {
  const creators = doc.querySelectorAll('identification creator');
  for (const creator of creators) {
    if (creator.getAttribute('type') === 'composer') {
      return creator.textContent?.trim() || '';
    }
  }

  // Fallback: any creator
  const firstCreator = doc.querySelector('identification creator');
  return firstCreator?.textContent?.trim() || '';
}

function extractKeySignature(doc: Document): string {
  const key = doc.querySelector('attributes key');
  if (!key) return 'C major';

  const fifths = parseInt(key.querySelector('fifths')?.textContent || '0', 10);
  const mode = key.querySelector('mode')?.textContent || 'major';

  if (mode === 'minor') {
    // Adjust for minor keys (3 fifths lower)
    const minorFifths = fifths + 3;
    const majorKey = FIFTHS_TO_KEY[minorFifths.toString() as unknown as number] || 'C major';
    const minorRoot = majorKey.split(' ')[0];
    return `${minorRoot} minor`;
  }

  return FIFTHS_TO_KEY[fifths] || 'C major';
}

function extractTimeSignature(doc: Document): string {
  const time = doc.querySelector('attributes time');
  if (!time) return '4/4';

  const beats = time.querySelector('beats')?.textContent || '4';
  const beatType = time.querySelector('beat-type')?.textContent || '4';

  return `${beats}/${beatType}`;
}

function extractTempo(doc: Document): number {
  // Try direction > sound tempo
  const sound = doc.querySelector('direction sound[tempo]');
  if (sound) {
    const tempo = parseFloat(sound.getAttribute('tempo') || '120');
    if (tempo > 0) return tempo;
  }

  // Try metronome
  const metronome = doc.querySelector('direction metronome');
  if (metronome) {
    const perMinute = metronome.querySelector('per-minute');
    if (perMinute?.textContent) {
      const tempo = parseFloat(perMinute.textContent);
      if (tempo > 0) return tempo;
    }
  }

  return 120;
}

function extractNotes(doc: Document, _timeSignature: string): Note[] {
  const notes: Note[] = [];
  const measures = doc.querySelectorAll('measure');
  let sequenceNumber = 1;

  measures.forEach((measure, measureIndex) => {
    const measureNumber = measureIndex + 1;
    let currentBeat = 1;

    const noteElements = measure.querySelectorAll('note');

    noteElements.forEach((noteEl) => {
      // Skip rest notes
      if (noteEl.querySelector('rest')) {
        const durationEl = noteEl.querySelector('type');
        const durType = durationEl?.textContent || 'quarter';
        const duration = MUSICXML_DURATION_MAP[durType] || 'quarter';
        currentBeat += DURATION_BEATS[duration] || 1;
        return;
      }

      // Skip chord notes (secondary notes in a chord)
      if (noteEl.querySelector('chord')) {
        return;
      }

      const pitch = extractPitch(noteEl);
      if (!pitch) return;

      const durationEl = noteEl.querySelector('type');
      const durType = durationEl?.textContent || 'quarter';
      const duration: NoteDuration = MUSICXML_DURATION_MAP[durType] || 'quarter';
      const durationBeats = DURATION_BEATS[duration] || 1;

      const { violinString, fingerPosition } = findBestViolinPosition(
        `${pitch.step}${pitch.alter ? (pitch.alter > 0 ? '#' : 'b') : ''}${pitch.octave}`
      );

      const note: Note = {
        id: `xml-note-${sequenceNumber}`,
        sequenceNumber,
        pitch: `${pitch.step}${pitch.alter ? (pitch.alter > 0 ? '#' : 'b') : ''}`,
        octave: pitch.octave,
        duration,
        durationBeats,
        measure: measureNumber,
        beat: currentBeat,
        positionInMeasure: sequenceNumber,
        violinString,
        fingerPosition,
        handPosition: 1,
        bowDirection: sequenceNumber % 2 === 0 ? 'UP' : 'DOWN',
        bowPortion: 'MIDDLE',
        technique: 'DETACHE',
      };

      notes.push(note);
      sequenceNumber++;
      currentBeat += durationBeats;
    });
  });

  return notes;
}

function extractPitch(noteEl: Element): { step: string; alter: number; octave: number } | null {
  const pitchEl = noteEl.querySelector('pitch');
  if (!pitchEl) return null;

  const step = pitchEl.querySelector('step')?.textContent || 'C';
  const alter = parseInt(pitchEl.querySelector('alter')?.textContent || '0', 10);
  const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4', 10);

  return { step, alter, octave };
}

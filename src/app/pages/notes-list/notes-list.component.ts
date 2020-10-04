import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Note } from 'src/app/shared/note.model';
import { NotesService } from 'src/app/shared/notes.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  animations: [
    trigger('itemAnimation', [
      // ENTRY ANIMATION
      transition('void => *', [
        // Set initial state
        style({
          height: 0,
          opacity: 0,
          transform: 'scale(0.85)',
          'margin-bottom': 0,

          // Have to expand out the padding properties
          paddingTop: 0,
          paddingBottom: 0,
          paddingRight: 0,
          paddingLeft: 0,
        }),
        // First want to animate the spacing which include height and margin
        animate(
          '50ms',
          style({
            height: '*',
            'margin-bottom': '*',
            paddingTop: '*',
            paddingBottom: '*',
            paddingRight: '*',
            paddingLeft: '*',
          })
        ),
        animate(75),
      ]),

      // ENTRY ANIMATION
      transition('* => void', [
        // Scale up
        animate(50, style({ transform: 'scale(1.05)' })),
        // Scale down
        animate(50, style({ transform: 'scale(1.00)', opacity: 0.75 })),
        // Scale down and fade out completely
        animate(
          '120ms ease-out',
          style({ transform: 'scale(0.68)', opacity: 0 })
        ),
        // Animate the spacing, height, margin and padding
        animate(
          '150ms ease-out',
          style({
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingRight: 0,
            paddingLeft: 0,
            'margin-bottom': 0,
          })
        ),
      ]),
    ]),

    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({
              opacity: 0,
              height: 0,
            }),
            stagger(100, [animate('0.2s ease')]),
          ],
          {
            optional: true,
          }
        ),
      ]),
    ]),
  ],
})
export class NotesListComponent implements OnInit {
  notes: Note[] = new Array<Note>();
  filteredNotes: Note[] = new Array<Note>();

  @ViewChild('filterInput') filterInputElRef: ElementRef<HTMLInputElement>;

  constructor(private notesService: NotesService) {}

  ngOnInit(): void {
    // Want to retrieve all notes from NotesService
    this.notes = this.notesService.getAll();
    // this.filteredNotes = this.notesService.getAll();
    this.filter('');
  }

  deleteNote(note: Note) {
    const noteId = this.notesService.getId(note);
    this.notesService.delete(noteId);
    this.filter(this.filterInputElRef.nativeElement.value);
  }

  generateNoteURL(note: Note) {
    const noteId = this.notesService.getId(note);
    return noteId;
  }

  filter(filterQuery: string) {
    filterQuery = filterQuery.toLowerCase().trim();
    let allResults: Note[] = new Array<Note>();

    // Split up the filterQuery into individual words, split on spaces
    let terms: string[] = filterQuery.split(' ');

    // Remove duplicate search terms
    terms = this.removeDuplicates(terms);

    // Compile all relevant results into the allResults array
    terms.forEach((term) => {
      const results: Note[] = this.relevantNotes(term);
      allResults = [...allResults, ...results];
    });

    // allResults can include duplicate notes
    const uniqueResults = this.removeDuplicates(allResults);
    this.filteredNotes = uniqueResults;

    // Sort by relevancy
    this.sortByRelevancy(allResults);
  }

  removeDuplicates(arr: Array<any>): Array<any> {
    const uniqueResults: Set<any> = new Set<any>();

    // Loop through the array
    arr.forEach((word) => uniqueResults.add(word));

    return Array.from(uniqueResults);
  }

  relevantNotes(relevantQuery: string): Array<Note> {
    relevantQuery = relevantQuery.toLowerCase().trim();

    const relevantNotes = this.notes.filter((note) => {
      if (note.title && note.title.toLowerCase().includes(relevantQuery)) {
        return true;
      }

      if (note.body && note.body.toLowerCase().includes(relevantQuery)) {
        return true;
      }

      return false;
    });
    return relevantNotes;
  }

  sortByRelevancy(searchResults: Note[]) {
    // Calculate the relevancy of a note
    // Format - key:value => NoteId:number (note object id : count)
    const noteCountObject: object = {};

    searchResults.forEach((note) => {
      const noteId = this.notesService.getId(note);

      if (noteCountObject[noteId]) {
        noteCountObject[noteId]++;
      } else {
        noteCountObject[noteId] = 1;
      }
    });

    this.filteredNotes = this.filteredNotes.sort((a: Note, b: Note) => {
      const aId = this.notesService.getId(a);
      const bId = this.notesService.getId(b);

      const aCount = noteCountObject[aId];
      const bCount = noteCountObject[bId];

      return bCount - aCount;
    });
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DeckViewer } from './deck-viewer';
import { MoxfieldApiService } from '../../core';

describe('DeckViewer', () => {
  let component: DeckViewer;
  let fixture: ComponentFixture<DeckViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeckViewer, HttpClientTestingModule],
      providers: [MoxfieldApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(DeckViewer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty deck URL initially', () => {
    expect(component['deckUrl']()).toBe('');
  });

  it('should clear deck and URL when clearDeck is called', () => {
    component['deckUrl'].set('https://moxfield.com/decks/test123');
    component.clearDeck();
    expect(component['deckUrl']()).toBe('');
  });
});

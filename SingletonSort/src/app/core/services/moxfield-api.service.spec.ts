import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MoxfieldApiService } from './moxfield-api.service';
import { MoxfieldDeck } from '../models/moxfield.model';

describe('MoxfieldApiService', () => {
  let service: MoxfieldApiService;
  let httpMock: HttpTestingController;

  const mockDeck: MoxfieldDeck = {
    id: 'test123',
    name: 'Test Deck',
    description: 'A test deck',
    format: 'commander',
    visibility: 'public',
    publicUrl: 'https://moxfield.com/decks/test123',
    publicId: 'test123',
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    areCommentsEnabled: true,
    isShared: false,
    authorsCanEdit: true,
    createdAtUtc: '2024-01-01T00:00:00Z',
    lastUpdatedAtUtc: '2024-01-01T00:00:00Z',
    mainboard: { count: 99, cards: {} },
    sideboard: { count: 0, cards: {} },
    maybeboard: { count: 0, cards: {} },
    commanders: { count: 1, cards: {} },
    companions: { count: 0, cards: {} },
    tokens: { count: 0, cards: {} },
    hubs: [],
    authors: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MoxfieldApiService]
    });

    service = TestBed.inject(MoxfieldApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch deck by ID', async () => {
    const deckId = 'test123';
    const promise = service.getDeckById(deckId);

    const req = httpMock.expectOne(`https://api2.moxfield.com/v2/decks/all/${deckId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDeck);

    const result = await promise;
    expect(result).toEqual(mockDeck);
    expect(service.currentDeck()).toEqual(mockDeck);
  });

  it('should extract deck ID from URL', async () => {
    const url = 'https://moxfield.com/decks/test123';
    const promise = service.getDeckById(url);

    const req = httpMock.expectOne('https://api2.moxfield.com/v2/decks/all/test123');
    req.flush(mockDeck);

    await promise;
    expect(service.currentDeck()?.id).toBe('test123');
  });

  it('should handle errors', async () => {
    const deckId = 'invalid';

    try {
      const promise = service.getDeckById(deckId);

      const req = httpMock.expectOne(`https://api2.moxfield.com/v2/decks/all/${deckId}`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      await promise;
      fail('Should have thrown an error');
    } catch (error) {
      expect(service.hasError()).toBe(true);
      expect(service.error()?.statusCode).toBe(404);
    }
  });

  it('should clear deck', async () => {
    const promise = service.getDeckById('test123');
    const req = httpMock.expectOne('https://api2.moxfield.com/v2/decks/all/test123');
    req.flush(mockDeck);

    await promise;
    expect(service.hasDeck()).toBe(true);

    service.clearDeck();
    expect(service.hasDeck()).toBe(false);
    expect(service.currentDeck()).toBeNull();
  });

  it('should compute deck stats', async () => {
    const promise = service.getDeckById('test123');
    const req = httpMock.expectOne('https://api2.moxfield.com/v2/decks/all/test123');
    req.flush(mockDeck);

    await promise;

    const stats = service.deckStats();
    expect(stats).toEqual({
      totalCards: 99,
      sideboardCards: 0,
      maybeboardCards: 0,
      commanderCount: 1,
      companionCount: 0
    });
  });
});

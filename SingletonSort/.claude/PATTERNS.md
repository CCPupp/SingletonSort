# Angular Patterns & Best Practices

This guide documents the patterns and best practices for this Angular 20.1 project using signals and standalone components.

## Signals Pattern (Preferred State Management)

### Basic Signal Usage

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.html',
  styleUrl: './counter.scss'
})
export class Counter {
  // Simple signal
  count = signal(0);

  // Computed signal (derived state)
  doubleCount = computed(() => this.count() * 2);

  // Effect (side effects)
  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }

  // Methods to update signals
  increment() {
    this.count.update(value => value + 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### Signal Best Practices

1. **Use `protected readonly` for signals exposed to templates**:
```typescript
export class MyComponent {
  protected readonly items = signal<Item[]>([]);
}
```

2. **Use `computed` for derived state** instead of recalculating in templates:
```typescript
// Good
filteredItems = computed(() =>
  this.items().filter(item => item.active)
);

// Avoid (recalculates on every change detection)
getFilteredItems() {
  return this.items().filter(item => item.active);
}
```

3. **Use `update` for transformations**:
```typescript
// Good
addItem(item: Item) {
  this.items.update(current => [...current, item]);
}

// Also valid for simple cases
setItems(items: Item[]) {
  this.items.set(items);
}
```

4. **Use effects sparingly** - only for side effects like logging, persistence, or syncing with external systems:
```typescript
constructor() {
  effect(() => {
    localStorage.setItem('theme', this.theme());
  });
}
```

## RxJS Integration with Signals

### Converting Observables to Signals

```typescript
import { Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private dataService = inject(DataService);

  // Convert observable to signal
  data = toSignal(this.dataService.getData(), {
    initialValue: []
  });
}
```

### Converting Signals to Observables (when needed)

```typescript
import { toObservable } from '@angular/core/rxjs-interop';

export class MyComponent {
  searchTerm = signal('');

  // Convert signal to observable for RxJS operators
  searchTerm$ = toObservable(this.searchTerm);

  results$ = this.searchTerm$.pipe(
    debounceTime(300),
    switchMap(term => this.search(term))
  );
}
```

### When to Use RxJS vs Signals

- **Use Signals**: Local component state, simple derived state, most UI state
- **Use RxJS**: Complex async operations, debouncing, API calls, event streams

## Dependency Injection

### Modern inject() Function (Preferred)

```typescript
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

export class MyComponent {
  private router = inject(Router);
  private myService = inject(MyService);

  navigateAway() {
    this.router.navigate(['/home']);
  }
}
```

### Constructor Injection (Still Valid)

```typescript
export class MyComponent {
  constructor(
    private router: Router,
    private myService: MyService
  ) {}
}
```

### Providing Services

```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    MyService,  // Root-level service
    provideRouter(routes),
    // ... other providers
  ]
};

// Or for component-level
@Component({
  selector: 'app-example',
  providers: [LocalService]  // Only available to this component tree
})
export class Example {}
```

## Standalone Components

### Component Structure

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-example',
  imports: [
    CommonModule,      // ngIf, ngFor, etc.
    FormsModule,       // ngModel, forms
    OtherComponent,    // Other standalone components
    SomeDirective,     // Standalone directives
    SomePipe          // Standalone pipes
  ],
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
export class Example {
  // Component logic
}
```

### Important Imports

```typescript
// Common imports you'll need
import { CommonModule } from '@angular/common';           // *ngIf, *ngFor, pipes
import { FormsModule } from '@angular/forms';             // Template-driven forms
import { ReactiveFormsModule } from '@angular/forms';    // Reactive forms
import { RouterLink, RouterOutlet } from '@angular/router'; // Routing
import { HttpClient } from '@angular/common/http';       // HTTP requests
```

## Forms Patterns

### Reactive Forms with Signals

```typescript
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export class UserForm {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  isSubmitting = signal(false);

  async onSubmit() {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      try {
        await this.submitForm(this.form.value);
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }
}
```

## HTTP Requests

### Using HttpClient with Signals

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

export class DataComponent {
  private http = inject(HttpClient);

  // Automatic signal from HTTP request
  users = toSignal(
    this.http.get<User[]>('/api/users'),
    { initialValue: [] }
  );

  // Manual loading state
  isLoading = signal(false);

  async loadData() {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Data>('/api/data')
      );
      this.processData(data);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## Routing

### Route Configuration

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/user/user-detail').then(m => m.UserDetail)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFound)
  }
];
```

### Route Parameters with Signals

```typescript
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class UserDetail {
  private route = inject(ActivatedRoute);

  // Convert route params to signal
  userId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id')))
  );
}
```

## Template Patterns

### Control Flow Syntax (Angular 17+)

```html
<!-- If/Else -->
@if (isLoading()) {
  <app-spinner />
} @else if (hasError()) {
  <app-error [error]="error()" />
} @else {
  <div>{{ content() }}</div>
}

<!-- For Loop -->
@for (item of items(); track item.id) {
  <app-item [data]="item" />
} @empty {
  <p>No items found</p>
}

<!-- Switch -->
@switch (status()) {
  @case ('loading') {
    <app-spinner />
  }
  @case ('success') {
    <app-content />
  }
  @default {
    <app-error />
  }
}
```

### Signal Template Binding

```html
<!-- Signal values are called as functions in templates -->
<h1>{{ title() }}</h1>

<!-- Two-way binding with signal -->
<input [(ngModel)]="searchTerm" />

<!-- Property binding -->
<button [disabled]="isLoading()">Submit</button>

<!-- Event binding -->
<button (click)="increment()">Count: {{ count() }}</button>

<!-- Class/Style binding -->
<div [class.active]="isActive()" [style.color]="color()">
  Content
</div>
```

## Component Communication

### Input/Output Pattern

```typescript
import { Component, input, output } from '@angular/core';

export class ChildComponent {
  // Signal-based inputs
  data = input.required<string>();
  count = input(0);  // with default

  // Signal-based outputs
  save = output<string>();
  cancel = output();

  onSave() {
    this.save.emit('data');
  }
}
```

### Parent-Child Communication

```html
<!-- parent.html -->
<app-child
  [data]="myData()"
  [count]="counter()"
  (save)="handleSave($event)"
  (cancel)="handleCancel()"
/>
```

## Service Patterns

### Basic Service with Signals

```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSignal = signal<Data[]>([]);

  // Expose readonly signal
  readonly data = this.dataSignal.asReadonly();

  async loadData() {
    const result = await fetch('/api/data');
    const data = await result.json();
    this.dataSignal.set(data);
  }

  addItem(item: Data) {
    this.dataSignal.update(current => [...current, item]);
  }
}
```

## Error Handling

### Component Error Handling

```typescript
export class DataComponent {
  error = signal<string | null>(null);
  isLoading = signal(false);

  async loadData() {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const data = await this.fetchData();
      this.processData(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## Testing Patterns

### Component Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]  // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should increment counter', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```

## Performance Optimization

### OnPush Change Detection (Default with Signals)

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,  // Recommended
  // ... other config
})
export class OptimizedComponent {
  // Signals work perfectly with OnPush
}
```

### Lazy Loading

```typescript
// Lazy load components
{
  path: 'feature',
  loadComponent: () => import('./feature/feature').then(m => m.Feature)
}

// Lazy load with child routes
{
  path: 'feature',
  loadChildren: () => import('./feature/feature.routes').then(m => m.FEATURE_ROUTES)
}
```

## Common Anti-Patterns to Avoid

1. **Don't mutate signal state directly**:
```typescript
// Bad
this.items().push(newItem);

// Good
this.items.update(items => [...items, newItem]);
```

2. **Don't use getters for computed state**:
```typescript
// Bad (recalculates every change detection)
get fullName() {
  return `${this.firstName()} ${this.lastName()}`;
}

// Good (memoized)
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
```

3. **Don't overuse effects**:
```typescript
// Bad
effect(() => {
  this.derivedValue.set(this.value() * 2);
});

// Good
derivedValue = computed(() => this.value() * 2);
```

4. **Don't forget to call signals in templates**:
```html
<!-- Bad -->
<h1>{{ title }}</h1>

<!-- Good -->
<h1>{{ title() }}</h1>
```

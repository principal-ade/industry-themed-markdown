import defaultTheme, { ThemeProvider } from '@principal-ade/industry-theme';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { IndustryZoomableMermaidDiagram } from './IndustryZoomableMermaidDiagram';

const meta: Meta<typeof IndustryZoomableMermaidDiagram> = {
  title: 'IndustryMarkdown/FullPageMermaid',
  component: IndustryZoomableMermaidDiagram,
  decorators: [
    Story => (
      <ThemeProvider theme={defaultTheme}>
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    theme: defaultTheme,
  },
};

export default meta;
type Story = StoryObj<typeof IndustryZoomableMermaidDiagram>;

export const SimpleFlowchart: Story = {
  args: {
    id: 'simple-flowchart',
    fitStrategy: 'contain',
    code: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`,
  },
};

export const ComplexFlowchart: Story = {
  args: {
    id: 'complex-flowchart',
    fitStrategy: 'contain',
    code: `graph TB
    Start([User Request]) --> Auth{Authenticated?}
    Auth -->|No| Login[Login Page]
    Auth -->|Yes| CheckRole{Check User Role}

    Login --> LoginProcess[Authentication Process]
    LoginProcess --> Auth

    CheckRole -->|Admin| AdminDash[Admin Dashboard]
    CheckRole -->|User| UserDash[User Dashboard]
    CheckRole -->|Guest| GuestView[Limited View]

    AdminDash --> AdminActions{Admin Actions}
    AdminActions -->|Manage Users| UserMgmt[User Management]
    AdminActions -->|View Reports| Reports[Analytics Reports]
    AdminActions -->|System Config| Config[System Configuration]

    UserDash --> UserActions{User Actions}
    UserActions -->|View Profile| Profile[Profile Page]
    UserActions -->|Edit Settings| Settings[Settings Page]
    UserActions -->|View Data| DataView[Data Dashboard]

    GuestView --> GuestActions{Guest Actions}
    GuestActions -->|Sign Up| SignUp[Registration]
    GuestActions -->|Learn More| Info[Information Page]

    UserMgmt --> Database[(Database)]
    Reports --> Database
    Config --> Database
    Profile --> Database
    Settings --> Database
    DataView --> Database
    SignUp --> Database`,
  },
};

export const SequenceDiagram: Story = {
  args: {
    id: 'sequence-diagram',
    fitStrategy: 'contain',
    code: `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database
    participant C as Cache

    U->>F: Click "Load Data"
    F->>A: GET /api/data
    A->>C: Check cache
    alt Cache Hit
        C-->>A: Return cached data
    else Cache Miss
        A->>D: Query database
        D-->>A: Return results
        A->>C: Store in cache
    end
    A-->>F: JSON response
    F-->>U: Display data

    Note over U,F: User sees updated UI

    U->>F: Modify data
    F->>A: POST /api/data
    A->>D: Update database
    A->>C: Invalidate cache
    D-->>A: Confirm update
    A-->>F: Success response
    F-->>U: Show confirmation`,
  },
};

export const ClassDiagram: Story = {
  args: {
    id: 'class-diagram',
    fitStrategy: 'contain',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        #String species
        -float weight
        +makeSound()
        +move()
        #sleep()
        -digest()
    }

    class Dog {
        +String breed
        +bark()
        +wagTail()
    }

    class Cat {
        +String color
        +meow()
        +purr()
    }

    class Bird {
        +float wingspan
        +fly()
        +chirp()
    }

    class Fish {
        +String waterType
        +swim()
        +bubble()
    }

    Animal <|-- Dog : inherits
    Animal <|-- Cat : inherits
    Animal <|-- Bird : inherits
    Animal <|-- Fish : inherits

    class Owner {
        +String name
        +String address
        +feedPet()
        +playWithPet()
    }

    class Veterinarian {
        +String licenseNumber
        +examine()
        +prescribe()
    }

    Owner "1" --> "*" Animal : owns
    Veterinarian "*" --> "*" Animal : treats`,
  },
};

export const StateDiagram: Story = {
  args: {
    id: 'state-diagram',
    fitStrategy: 'contain',
    code: `stateDiagram-v2
    [*] --> Idle

    Idle --> Loading : User clicks button
    Loading --> Success : Data loaded
    Loading --> Error : Load failed

    Success --> Idle : Reset
    Error --> Idle : Reset
    Error --> Loading : Retry

    Success --> Processing : User confirms
    Processing --> Completed : Process done
    Processing --> Failed : Process error

    Completed --> [*]
    Failed --> Error : Show error

    note right of Loading : Show spinner
    note left of Error : Display error message
    note right of Success : Show data
    note left of Processing : Update progress bar`,
  },
};

export const GanttChart: Story = {
  args: {
    id: 'gantt-chart',
    fitStrategy: 'width',
    code: `gantt
    title Project Development Timeline
    dateFormat YYYY-MM-DD

    section Planning
    Requirements Analysis    :done,    des1, 2024-01-01, 2024-01-15
    System Design           :done,    des2, 2024-01-10, 2024-01-25
    Technical Spec          :done,    des3, 2024-01-20, 2024-02-01

    section Development
    Backend API            :active,   dev1, 2024-02-01, 2024-03-15
    Frontend UI            :active,   dev2, 2024-02-15, 2024-04-01
    Database Schema        :done,     dev3, 2024-02-01, 2024-02-20
    Integration            :         dev4, 2024-03-15, 2024-04-15

    section Testing
    Unit Tests             :         test1, 2024-03-01, 2024-04-15
    Integration Tests      :         test2, 2024-03-20, 2024-04-20
    User Acceptance        :         test3, 2024-04-15, 2024-05-01

    section Deployment
    Staging Deploy         :         dep1, 2024-04-20, 2024-04-25
    Production Deploy      :         dep2, 2024-05-01, 2024-05-05
    Post-Launch Support    :         dep3, 2024-05-05, 2024-06-01`,
  },
};

export const PieChart: Story = {
  args: {
    id: 'pie-chart',
    fitStrategy: 'contain',
    code: `pie title Technology Stack Distribution
    "TypeScript" : 35
    "React" : 25
    "Node.js" : 20
    "PostgreSQL" : 10
    "Docker" : 5
    "Other" : 5`,
  },
};

export const EntityRelationship: Story = {
  args: {
    id: 'er-diagram',
    fitStrategy: 'contain',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string id PK
        string name
        string email UK
        string phone
        datetime created_at
        datetime updated_at
    }

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string customer_id FK
        float total_amount
        string status
        datetime order_date
        datetime shipped_date
    }

    ORDER_ITEM }o--|| PRODUCT : includes
    ORDER_ITEM {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
        float unit_price
        float discount
    }

    PRODUCT }o--|| CATEGORY : belongs_to
    PRODUCT {
        string id PK
        string name
        string description
        float price
        int stock_quantity
        string category_id FK
        string sku UK
    }

    CATEGORY {
        string id PK
        string name
        string description
        string parent_id FK
    }

    PRODUCT }o--o{ SUPPLIER : supplied_by
    SUPPLIER {
        string id PK
        string name
        string contact_email
        string contact_phone
        string address
    }`,
  },
};

export const GitGraph: Story = {
  args: {
    id: 'git-graph',
    fitStrategy: 'contain',
    code: `gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Add login feature"
    commit id: "Add user dashboard"

    branch feature/payment
    checkout feature/payment
    commit id: "Add payment gateway"
    commit id: "Add payment validation"

    checkout develop
    merge feature/payment
    commit id: "Update dependencies"

    branch feature/notifications
    checkout feature/notifications
    commit id: "Add email notifications"
    commit id: "Add SMS notifications"

    checkout develop
    merge feature/notifications

    checkout main
    merge develop tag: "v1.0.0"

    branch hotfix/security
    checkout hotfix/security
    commit id: "Fix security vulnerability"

    checkout main
    merge hotfix/security tag: "v1.0.1"

    checkout develop
    merge hotfix/security`,
  },
};

export const UserJourney: Story = {
  args: {
    id: 'user-journey',
    fitStrategy: 'contain',
    code: `journey
    title User Shopping Experience

    section Discovery
      Visit Homepage: 5: User
      Browse Categories: 4: User
      Search Products: 5: User
      View Product Details: 5: User

    section Evaluation
      Read Reviews: 4: User
      Compare Products: 3: User
      Check Specifications: 4: User
      View Images: 5: User

    section Purchase
      Add to Cart: 5: User
      Review Cart: 4: User
      Enter Shipping Info: 3: User
      Select Payment Method: 4: User
      Confirm Order: 5: User

    section Post-Purchase
      Receive Confirmation: 5: User
      Track Shipment: 4: User
      Receive Product: 5: User
      Leave Review: 3: User`,
  },
};

export const VeryLargeDiagram: Story = {
  args: {
    id: 'very-large-diagram',
    fitStrategy: 'contain',
    padding: 0.9,
    code: `graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        Mobile[Mobile App]
        Web[Web App]
        Admin[Admin Portal]
    end

    subgraph "API Gateway"
        Gateway[API Gateway]
        Auth[Authentication]
        RateLimit[Rate Limiting]
        Cache[Response Cache]
    end

    subgraph "Microservices"
        UserService[User Service]
        OrderService[Order Service]
        PaymentService[Payment Service]
        NotificationService[Notification Service]
        InventoryService[Inventory Service]
        ReportingService[Reporting Service]
        SearchService[Search Service]
        RecommendationService[Recommendation Service]
    end

    subgraph "Message Queue"
        Queue[Message Queue]
        EventBus[Event Bus]
        TaskQueue[Task Queue]
    end

    subgraph "Data Layer"
        UserDB[(User DB)]
        OrderDB[(Order DB)]
        ProductDB[(Product DB)]
        AnalyticsDB[(Analytics DB)]
        CacheDB[(Redis Cache)]
        SearchIndex[(Elasticsearch)]
    end

    subgraph "External Services"
        PaymentGateway[Payment Gateway]
        EmailProvider[Email Provider]
        SMSProvider[SMS Provider]
        ShippingAPI[Shipping API]
        TaxAPI[Tax Calculator]
    end

    subgraph "Infrastructure"
        LoadBalancer[Load Balancer]
        CDN[CDN]
        Monitoring[Monitoring]
        Logging[Logging]
        Backup[Backup System]
    end

    UI --> Gateway
    Mobile --> Gateway
    Web --> Gateway
    Admin --> Gateway

    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> Cache

    Auth --> UserService
    Gateway --> UserService
    Gateway --> OrderService
    Gateway --> PaymentService
    Gateway --> NotificationService
    Gateway --> InventoryService
    Gateway --> ReportingService
    Gateway --> SearchService
    Gateway --> RecommendationService

    UserService --> UserDB
    OrderService --> OrderDB
    PaymentService --> PaymentGateway
    NotificationService --> EmailProvider
    NotificationService --> SMSProvider
    InventoryService --> ProductDB
    ReportingService --> AnalyticsDB
    SearchService --> SearchIndex
    RecommendationService --> AnalyticsDB

    OrderService --> Queue
    PaymentService --> Queue
    NotificationService --> EventBus
    InventoryService --> EventBus

    Queue --> TaskQueue
    EventBus --> TaskQueue

    OrderService --> ShippingAPI
    OrderService --> TaxAPI

    UserService --> CacheDB
    OrderService --> CacheDB
    InventoryService --> CacheDB

    LoadBalancer --> Gateway
    CDN --> UI
    CDN --> Web
    CDN --> Mobile

    Monitoring --> UserService
    Monitoring --> OrderService
    Monitoring --> PaymentService
    Monitoring --> NotificationService
    Monitoring --> InventoryService

    Logging --> Gateway
    Logging --> Queue
    Logging --> EventBus

    Backup --> UserDB
    Backup --> OrderDB
    Backup --> ProductDB
    Backup --> AnalyticsDB`,
  },
};

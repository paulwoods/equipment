# Claude Code Instructions — Spring Boot 4 / Java 25 RESTful API

This document defines the coding standards, patterns, and conventions Claude Code must follow
when generating, editing, or reviewing Java Spring Boot applications.

---

## Stack

| Concern             | Technology                                                                            |
|---------------------|---------------------------------------------------------------------------------------|
| Language            | Java 25 (use modern features: records, sealed classes, pattern matching, text blocks) |
| Framework           | Spring Boot 4.x                                                                       |
| Build Tool          | Maven or Gradle (match what exists in the project)                                    |
| Boilerplate         | Lombok (always prefer over manual getters/setters/constructors)                       |
| Persistence         | Spring Data JPA (Hibernate) or Spring Data JDBC                                       |
| Validation          | Jakarta Validation (`jakarta.validation.*`)                                           |
| Unit Testing        | JUnit 5 + Mockito                                                                     |
| Integration Testing | Spring Boot Test + Testcontainers                                                     |
| API Documentation   | SpringDoc OpenAPI 3 (`springdoc-openapi`)                                             |
| Security            | Spring Security 7 (when applicable)                                                   |

---

## Project Package Structure

Organize by feature/domain slice, not by technical layer.

```
com.example.myapp
├── MyAppApplication.java
├── common/                        # Shared utilities, base classes, exceptions
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── ResourceNotFoundException.java
│       └── BusinessException.java
├── config/                        # Spring configuration classes
│   ├── SecurityConfig.java
│   ├── OpenApiConfig.java
│   └── WebConfig.java             # @EnableSpringDataWebSupport configured here
└── {feature}/                     # One package per domain feature
    ├── {Feature}Controller.java
    ├── {Feature}Service.java      # Concrete @Service class — no interface unless needed
    ├── {Feature}Repository.java
    ├── {Feature}.java             # JPA Entity
    ├── dto/
    │   ├── {Feature}CreateRequest.java   # One record per controller method input
    │   ├── {Feature}UpdateRequest.java
    │   ├── {Feature}ListResponse.java    # One record per controller method output
    │   ├── {Feature}DetailResponse.java
    │   └── ...
    └── mapper/
        └── {Feature}Mapper.java   # Manual or MapStruct mapper
```

---

## RESTful API Conventions

### HTTP Verbs & Status Codes

| Operation      | Method | URL Pattern              | Success Code   |
|----------------|--------|--------------------------|----------------|
| List all       | GET    | `/api/v1/resources`      | 200 OK         |
| Get one        | GET    | `/api/v1/resources/{id}` | 200 OK         |
| Create         | POST   | `/api/v1/resources`      | 201 Created    |
| Full replace   | PUT    | `/api/v1/resources/{id}` | 200 OK         |
| Partial update | PATCH  | `/api/v1/resources/{id}` | 200 OK         |
| Delete         | DELETE | `/api/v1/resources/{id}` | 204 No Content |

### URL Rules

- Use **kebab-case** for multi-word resource names: `/api/v1/order-items`
- Always version the API: `/api/v1/...`
- Use **plural nouns** for resource names: `/users`, `/products`
- Never use verbs in URLs: ~~`/getUser`~~, ~~`/createOrder`~~
- Nest resources only one level deep: `/api/v1/orders/{id}/items`
- Use query parameters for filtering, sorting, pagination:
  `GET /api/v1/products?category=electronics&sort=price,asc&page=0&size=20`

### Success Responses

Return the DTO (or `PagedModel`) directly in the `ResponseEntity` body — no custom success envelope wrapper.

### Error Responses — ProblemDetail (RFC 9457)

All error responses must use Spring's built-in `ProblemDetail` object, which complies with RFC 9457.
Do **not** create a custom error envelope. Spring Boot 4 supports this natively.

```java
// common/exception/GlobalExceptionHandler.java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException ex,
                                                        HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> Objects.requireNonNullElse(fe.getDefaultMessage(), "Invalid value"),
                        (a, b) -> a
                ));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setTitle("Validation Error");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        problem.setTitle("Internal Server Error");
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
```

A `ProblemDetail` response looks like:

```json
{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Product not found with id: 99",
  "instance": "/api/v1/products/99"
}
```

Validation errors include an additional `errors` property:

```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/products",
  "errors": {
    "name": "Name is required",
    "price": "Price must be positive"
  }
}
```

---

## Layer Conventions

### Controller Layer

- Annotate with `@RestController` and `@RequestMapping`
- Inject only the **Service** — never the repository directly
- Use `@Valid` on request body parameters
- Return the DTO directly in `ResponseEntity<T>` — no wrapper envelope
- Keep controllers thin: no business logic, no direct entity access
- Document every endpoint with SpringDoc OpenAPI annotations

```java

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management endpoints")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List all products")
    public ResponseEntity<PagedModel<ProductListResponse>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(productService.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ProductDetailResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a product")
    public ResponseEntity<ProductCreateResponse> create(
            @Valid @RequestBody ProductCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product")
    public ResponseEntity<ProductUpdateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Service Layer

- Create a **single concrete `@Service` class** — do not create a separate interface unless the service has multiple
  implementations or is used in a context that requires polymorphism (e.g., strategy pattern, proxying across modules)
- Annotate the class with `@Service` and `@Transactional(readOnly = true)` at the class level
- Override with `@Transactional` (read-write) on individual write methods
- All business logic, validation logic, and exception throwing goes here
- Never expose JPA entities to the controller — always map to per-method DTOs

```java

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public PagedModel<ProductListResponse> findAll(Pageable pageable) {
        return productMapper.toPagedListResponse(productRepository.findAll(pageable));
    }

    public ProductDetailResponse findById(Long id) {
        return productRepository.findById(id)
                .map(productMapper::toDetailResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public ProductCreateResponse create(ProductCreateRequest request) {
        var product = productMapper.toEntity(request);
        return productMapper.toCreateResponse(productRepository.save(product));
    }

    @Transactional
    public ProductUpdateResponse update(Long id, ProductUpdateRequest request) {
        var product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productMapper.updateEntityFromRequest(request, product);
        return productMapper.toUpdateResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
}
```

**When to introduce a Service interface:** Only when there are (or will be) multiple concrete implementations, or when
the service must be mocked across module boundaries. For standard CRUD and business services, the concrete class is
sufficient.

### Repository Layer

- Extend `JpaRepository<Entity, ID>` or `CrudRepository`
- Add custom query methods using Spring Data method naming OR `@Query` with JPQL
- Never use native SQL unless absolutely necessary; prefer JPQL
- Place custom queries inside the repository interface — do not create `RepositoryImpl` unless needed

```java

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryAndActiveTrue(String category);

    @Query("SELECT p FROM Product p WHERE p.price BETWEEN :min AND :max")
    List<Product> findByPriceRange(@Param("min") BigDecimal min, @Param("max") BigDecimal max);

    boolean existsBySkuCode(String skuCode);
}
```

---

## Lombok Usage

Always prefer Lombok over manual boilerplate. Use these annotations consistently:

| Use Case             | Annotation(s)                                                        |
|----------------------|----------------------------------------------------------------------|
| All-args constructor | `@AllArgsConstructor`                                                |
| No-args constructor  | `@NoArgsConstructor`                                                 |
| Inject final fields  | `@RequiredArgsConstructor` (prefer for DI)                           |
| Getters + setters    | `@Data` (avoid on JPA entities — use `@Getter`/`@Setter` instead)    |
| Builder pattern      | `@Builder` (never on JPA entities)                                   |
| Logging              | `@Slf4j` (on services, controllers — not entities)                   |
| JPA entities         | `@Getter` + `@Setter` + `@NoArgsConstructor` + `@AllArgsConstructor` |

**JPA Entity Lombok rules:**

- Never use `@Data` on JPA entities (causes issues with `equals`/`hashCode` and lazy loading)
- Never use `@Builder` on JPA entities — it conflicts with the required no-args constructor and encourages constructing
  entities in an invalid state
- Never use `@EqualsAndHashCode` on entities — implement manually based on business key or use `@NaturalId`
- Never use `@Slf4j` on entities — entities should have minimal code with no logging concerns
- Always use `@NoArgsConstructor` since JPA requires it

```java

@Entity
@Table(name = "product")
// Singular table names — not "products". only break this rule if the name is a reservered word in the database.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String category;

    private final boolean active = true;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
```

---

## DTOs — Use Java Records, One Per Controller Method

Always use **Java Records** for DTOs. Critically, define a **unique record for each controller method's input and output
** — never reuse the same DTO across multiple endpoints. This keeps each contract explicit and independently evolvable.

### Naming Convention

| Controller Method       | Input Record             | Output Record             |
|-------------------------|--------------------------|---------------------------|
| `GET /resources`        | _(none / Pageable)_      | `{Feature}ListResponse`   |
| `GET /resources/{id}`   | _(none)_                 | `{Feature}DetailResponse` |
| `POST /resources`       | `{Feature}CreateRequest` | `{Feature}CreateResponse` |
| `PUT /resources/{id}`   | `{Feature}UpdateRequest` | `{Feature}UpdateResponse` |
| `PATCH /resources/{id}` | `{Feature}PatchRequest`  | `{Feature}PatchResponse`  |

### Example Records

```java
// Input: POST /api/v1/products
public record ProductCreateRequest(
                @NotBlank(message = "Name is required")
                @Size(max = 200)
                String name,

                @NotNull(message = "Price is required")
                @DecimalMin(value = "0.0", inclusive = false)
                BigDecimal price,

                @NotBlank(message = "Category is required")
                String category
        ) {
}

// Output: POST /api/v1/products
public record ProductCreateResponse(
        Long id,
        String name,
        BigDecimal price,
        String category,
        Instant createdAt
) {
}

// Input: PUT /api/v1/products/{id}
public record ProductUpdateRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 200)
        String name,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = false)
        BigDecimal price,

        @NotBlank(message = "Category is required")
        String category,

        boolean active
) {
}

// Output: PUT /api/v1/products/{id}
public record ProductUpdateResponse(
        Long id,
        String name,
        BigDecimal price,
        String category,
        boolean active,
        Instant updatedAt
) {
}

// Output: GET /api/v1/products (used inside PagedModel)
public record ProductListResponse(
        Long id,
        String name,
        BigDecimal price,
        String category
) {
}

// Output: GET /api/v1/products/{id}
public record ProductDetailResponse(
        Long id,
        String name,
        BigDecimal price,
        String category,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
```

**Why unique DTOs per method?** List responses are often trimmed (fewer fields for performance); detail responses are
rich; create responses may return fewer fields than an update response. Sharing DTOs creates hidden coupling and forces
unnecessary nullable fields.

---

## Exception Classes

Define custom exception types in `common/exception/`:

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
```

---

## Unit Testing — JUnit 5 + Mockito

**Rules:**

- Test the **Service layer** with pure unit tests — no Spring context
- Use `@ExtendWith(MockitoExtension.class)` — never `@SpringBootTest` for unit tests
- Mock all dependencies with `@Mock`; inject with `@InjectMocks`
- Follow the **Arrange / Act / Assert** pattern with clear blank-line separation
- Test both the **happy path** and **failure/edge cases**
- Name tests using: `methodName_StateUnderTest_ExpectedBehavior`

```java

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductService productService;

    @Test
    void findById_ExistingId_ReturnsProductDetailResponse() {
        // Arrange
        var productId = 1L;
        var product = new Product(productId, "Widget", BigDecimal.TEN, "Tools", true, Instant.now(), null);
        var expected = new ProductDetailResponse(productId, "Widget", BigDecimal.TEN, "Tools", true, Instant.now(), null);

        given(productRepository.findById(productId)).willReturn(Optional.of(product));
        given(productMapper.toDetailResponse(product)).willReturn(expected);

        // Act
        var actual = productService.findById(productId);

        // Assert
        assertThat(actual).isEqualTo(expected);
        then(productRepository).should().findById(productId);
    }

    @Test
    void findById_NonExistingId_ThrowsResourceNotFoundException() {
        // Arrange
        var productId = 99L;
        given(productRepository.findById(productId)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> productService.findById(productId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void create_ValidRequest_ReturnsProductCreateResponse() {
        // Arrange
        var request = new ProductCreateRequest("Widget", BigDecimal.TEN, "Tools");
        var entity = new Product();
        entity.setName("Widget");
        var saved = new Product(1L, "Widget", BigDecimal.TEN, "Tools", true, Instant.now(), null);
        var expected = new ProductCreateResponse(1L, "Widget", BigDecimal.TEN, "Tools", Instant.now());

        given(productMapper.toEntity(request)).willReturn(entity);
        given(productRepository.save(entity)).willReturn(saved);
        given(productMapper.toCreateResponse(saved)).willReturn(expected);

        // Act
        var actual = productService.create(request);

        // Assert
        assertThat(actual.id()).isEqualTo(1L);
        assertThat(actual.name()).isEqualTo("Widget");
    }
}
```

**Use AssertJ** (`assertThat`) for all assertions — never JUnit's `assertEquals`.
**Use BDDMockito** (`given`/`then`) style — never `when`/`verify`.

---

## Integration Testing — Spring Boot Test + Testcontainers

**Rules:**

- Test the **Controller layer** (full HTTP stack) with `@SpringBootTest` + `MockMvc`
- Use **Testcontainers** for real databases — never H2 in-memory for integration tests
- Annotate integration test classes with `@ActiveProfiles("test")`
- Use `@Sql` to set up and tear down test data
- Test HTTP status codes, response body structure, and headers
- Keep integration tests in `src/test/java` mirroring the production package structure
- Name integration test classes with suffix `IT`: `ProductControllerIT`
- Assert error responses against `ProblemDetail` fields (`title`, `status`, `detail`)

```java

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ProductControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Sql("/test-data/products.sql")
    void GET_products_id_returns200AndProductDetail() throws Exception {
        mockMvc.perform(get("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").isNotEmpty());
    }

    @Test
    void POST_products_validRequest_returns201() throws Exception {
        var request = new ProductCreateRequest("New Widget", new BigDecimal("19.99"), "Tools");

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("New Widget"));
    }

    @Test
    void POST_products_invalidRequest_returns400ProblemDetail() throws Exception {
        var request = new ProductCreateRequest("", null, "");

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Error"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    void GET_products_unknownId_returns404ProblemDetail() throws Exception {
        mockMvc.perform(get("/api/v1/products/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.status").value(404));
    }
}
```

---

## General Java 25 Style Rules

- Prefer **`var`** for local variable inference where the type is obvious from the right-hand side
- Use **text blocks** for multi-line strings (SQL, JSON templates, messages)
- Use **records** for immutable data carriers (DTOs, value objects)
- Use **sealed interfaces** for discriminated unions / domain result types
- Use **pattern matching** (`instanceof`, `switch`) instead of casting
- Use **`Stream.toList()`** instead of `Collectors.toList()`
- Avoid `null` — use `Optional<T>` for return types that may be absent
- Never use raw types — always parameterize generics
- Prefer constructor injection (via `@RequiredArgsConstructor`) over field injection
- Never use `@Autowired` on fields
- Keep methods short (prefer < 20 lines); extract helpers if needed
- Use `@Slf4j` from Lombok for logging — never `System.out.println`

---

## application.yaml Conventions

Use `application.yaml` (not `.properties` and not `.yml`). Split profiles into separate files:

- `application.yaml` — shared defaults
- `application-development.yaml` — local development overrides
- `application-test.yaml` — test profile (used by integration tests)
- `application-production.yaml` — production (no secrets hardcoded — use env vars)

```yaml
# application.yaml
spring:
  application:
    name: my-app
  jpa:
    open-in-view: false        # Always disable - avoids lazy loading pitfalls
    hibernate:
      ddl-auto: validate       # Never use 'create' or 'update' in production
    properties:
      hibernate:
        format_sql: true
  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false

server:
  port: 8080
  servlet:
    context-path: /

logging:
  level:
    root: INFO
    com.example.myapp: DEBUG
```

---

## Pagination Convention

All list endpoints returning potentially large datasets must support pagination and return `PagedModel<T>`.

### Global Configuration (Required)

Enable `PagedModel` serialization globally via `@EnableSpringDataWebSupport` in a configuration class. This is the
canonical approach — do not configure it per-controller or per-method.

```java
// config/WebConfig.java
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class WebConfig {
    // PagedModel serialization is now active for all paginated responses
}
```

### Controller

```java

@GetMapping
@Operation(summary = "List all products")
public ResponseEntity<PagedModel<ProductListResponse>> findAll(
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable) {
    return ResponseEntity.ok(productService.findAll(pageable));
}
```

### Service

```java
public PagedModel<ProductListResponse> findAll(Pageable pageable) {
    return productMapper.toPagedListResponse(productRepository.findAll(pageable));
}
```

The `VIA_DTO` mode produces a stable, well-structured JSON response:

```json
{
  "content": [
    {
      "id": 1,
      "name": "Widget",
      "price": 19.99,
      "category": "Tools"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

## Security Conventions (when applicable)

- Use `SecurityFilterChain` bean (not `WebSecurityConfigurerAdapter` — removed in Spring 6+)
- Prefer JWT-based stateless authentication for REST APIs
- Annotate secured methods with `@PreAuthorize("hasRole('ADMIN')")`
- Never store passwords in plaintext — always use `BCryptPasswordEncoder`
- Disable CSRF for stateless REST APIs

---

## What Claude Code Must NEVER Do

- ❌ Never put business logic in a Controller
- ❌ Never expose JPA entities directly in API responses
- ❌ Never use `@Autowired` on fields — always use constructor injection
- ❌ Never use H2 in integration tests — use Testcontainers
- ❌ Never use `@Data` on JPA entities
- ❌ Never use `@Builder` on JPA entities — it is an anti-pattern with JPA
- ❌ Never use `@Slf4j` on JPA entities — entities must have minimal code
- ❌ Never use plural table names — use singular (`product`, not `products`). only break this rule if the name is a
  reserved word in the database.
- ❌ Never create a Service interface unless multiple implementations are needed
- ❌ Never name a class `*ServiceImpl` unless it implements an explicit interface
- ❌ Never reuse the same DTO record across multiple controller methods — each method gets its own input and output
  record
- ❌ Never return a custom error envelope — use `ProblemDetail` (RFC 9457)
- ❌ Never return `Page<T>` directly from a controller — use `PagedModel<T>` with `VIA_DTO` mode configured globally
- ❌ Never catch and swallow exceptions silently
- ❌ Never hardcode secrets or URLs — use `application.yaml` with environment variable overrides
- ❌ Never use `Collectors.toList()` — use `.toList()` (Java 16+)
- ❌ Never write native SQL unless JPQL cannot support the query
- ❌ Never use `System.out.println` for logging
- ❌ Never use `.yml` file extension — always use `.yaml`
- ❌ Never use profile names `dev`, `test`, or `prod` — use `development`, `test`, `production`
- 
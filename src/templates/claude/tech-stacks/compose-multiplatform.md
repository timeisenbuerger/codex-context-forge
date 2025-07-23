# {{projectName}} - Claude Code Context

This file provides comprehensive guidance to Claude Code when working with this Compose Multiplatform application with Kotlin.

## Project Overview

{{description}}

{{#if platforms}}
### Target Platforms
{{#each platforms}}
- {{#if (eq this "android")}}🤖 **Android** - Mobile platform with Material Design{{/if}}{{#if (eq this "ios")}}🍎 **iOS** - Mobile platform with native feel{{/if}}{{#if (eq this "desktop")}}🖥️ **Desktop** - JVM-based desktop application{{/if}}{{#if (eq this "js")}}🌐 **Web (JS)** - JavaScript-based web application{{/if}}{{#if (eq this "wasmJs")}}🚀 **Web (WASM)** - WebAssembly-based web application{{/if}}
{{/each}}
{{/if}}

{{#if composeVersion}}
### Compose Multiplatform Version
Using Compose Multiplatform **{{composeVersion}}**
{{/if}}

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed.

### Design Principles

- **Composition over Inheritance**: Use Compose's declarative approach
- **Unidirectional Data Flow**: State flows down, events flow up
- **Single Source of Truth**: Centralize state management
- **Immutability**: Prefer immutable data structures
- **Platform-specific Implementation**: Use expect/actual for platform differences

## 🧱 Code Structure & Modularity

### File and Class Limits

- **Never create a file longer than 300 lines**
- **Composables should have single responsibility**
- **Functions should be under 30 lines**
- **Use proper package structure across platforms**

## 🚀 Compose Multiplatform & Kotlin Best Practices

### Composables and Structure (MANDATORY)

- **MUST use proper Compose patterns**
- **MUST follow state management conventions**
- **MUST use dependency injection (Koin/Dagger)**
- **MUST validate inputs and handle edge cases**

```kotlin
package com.{{projectName}}.presentation.user

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.{{projectName}}.domain.model.User
import com.{{projectName}}.presentation.components.LoadingIndicator
import com.{{projectName}}.presentation.components.ErrorMessage

@Composable
fun UserListScreen(
    state: UserListState,
    onUserClick: (Long) -> Unit,
    onRefresh: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when {
            state.isLoading && state.users.isEmpty() -> {
                LoadingIndicator()
            }
            
            state.error != null && state.users.isEmpty() -> {
                ErrorMessage(
                    message = state.error,
                    onRetry = onRetry
                )
            }
            
            else -> {
                UserList(
                    users = state.users,
                    onUserClick = onUserClick,
                    onRefresh = onRefresh,
                    isRefreshing = state.isLoading
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UserList(
    users: List<User>,
    onUserClick: (Long) -> Unit,
    onRefresh: () -> Unit,
    isRefreshing: Boolean,
    modifier: Modifier = Modifier
) {
    val pullToRefreshState = rememberPullToRefreshState()
    
    if (pullToRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            onRefresh()
        }
    }
    
    LaunchedEffect(isRefreshing) {
        if (!isRefreshing) {
            pullToRefreshState.endRefresh()
        }
    }
    
    Box(modifier = modifier.nestedScroll(pullToRefreshState.nestedScrollConnection)) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(
                items = users,
                key = { it.id }
            ) { user ->
                UserItem(
                    user = user,
                    onClick = { onUserClick(user.id) }
                )
            }
        }
        
        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}
```

## 🏗️ Project Structure

```
{{projectStructure}}
```

### Typical Compose Multiplatform Structure

```
src/
├── commonMain/
│   └── kotlin/
│       └── com/{{projectName}}/
│           ├── di/                 # Dependency injection modules
│           ├── data/
│           │   ├── local/          # Local data sources
│           │   ├── remote/         # Remote data sources
│           │   ├── repository/     # Repository implementations
│           │   └── mapper/         # Data mappers
│           ├── domain/
│           │   ├── model/          # Domain models
│           │   ├── repository/     # Repository interfaces
│           │   └── usecase/        # Use cases
│           ├── presentation/
│           │   ├── ui/
│           │   │   ├── components/ # Reusable UI components
│           │   │   ├── screens/    # Screen composables
│           │   │   └── theme/      # Theme and styling
│           │   └── viewmodel/      # ViewModels
│           └── util/               # Utilities
├── androidMain/
│   └── kotlin/                     # Android-specific code
├── iosMain/
│   └── kotlin/                     # iOS-specific code
├── desktopMain/
│   └── kotlin/                     # Desktop-specific code
└── wasmJsMain/
    └── kotlin/                     # Web-specific code
```

## 🛡️ Data Validation & State Management

### State Classes and Validation

```kotlin
package com.{{projectName}}.presentation.user

import com.{{projectName}}.domain.model.User

data class UserListState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedFilter: UserFilter = UserFilter.ALL
) {
    val filteredUsers: List<User>
        get() = users.filter { user ->
            user.name.contains(searchQuery, ignoreCase = true) ||
            user.email.contains(searchQuery, ignoreCase = true)
        }.filter { user ->
            when (selectedFilter) {
                UserFilter.ALL -> true
                UserFilter.ACTIVE -> user.isActive
                UserFilter.INACTIVE -> !user.isActive
            }
        }
}

data class UserFormState(
    val name: String = "",
    val email: String = "",
    val age: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
) {
    val nameError: String?
        get() = when {
            name.isBlank() -> "Name is required"
            name.length < 2 -> "Name must be at least 2 characters"
            name.length > 50 -> "Name must be less than 50 characters"
            else -> null
        }
    
    val emailError: String?
        get() = when {
            email.isBlank() -> "Email is required"
            !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() -> "Invalid email format"
            else -> null
        }
    
    val ageError: String?
        get() = when {
            age.isBlank() -> "Age is required"
            age.toIntOrNull() == null -> "Age must be a number"
            age.toInt() < 18 -> "Age must be at least 18"
            age.toInt() > 120 -> "Age must be less than 120"
            else -> null
        }
    
    val isValid: Boolean
        get() = nameError == null && emailError == null && ageError == null && 
               name.isNotBlank() && email.isNotBlank() && age.isNotBlank()
}
```

## 🧪 Testing Strategy

### Requirements

- **MINIMUM 80% code coverage**
- **MUST use Kotlin Test and MockK**
- **MUST test all layers**
- **MUST use Compose Test for UI testing**

```kotlin
package com.{{projectName}}.presentation.user

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.{{projectName}}.domain.model.User
import com.{{projectName}}.presentation.theme.AppTheme
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test
import kotlin.test.assertEquals

class UserListScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun userListScreen_showsLoadingIndicator_whenStateIsLoading() {
        // Given
        val state = UserListState(isLoading = true, users = emptyList())
        
        // When
        composeTestRule.setContent {
            AppTheme {
                UserListScreen(
                    state = state,
                    onUserClick = {},
                    onRefresh = {},
                    onRetry = {}
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithTag("loading_indicator").assertIsDisplayed()
    }

    @Test
    fun userListScreen_showsUsers_whenStateHasUsers() {
        // Given
        val users = listOf(
            User(id = 1, name = "John Doe", email = "john@example.com", isActive = true),
            User(id = 2, name = "Jane Smith", email = "jane@example.com", isActive = true)
        )
        val state = UserListState(users = users, isLoading = false)
        
        // When
        composeTestRule.setContent {
            AppTheme {
                UserListScreen(
                    state = state,
                    onUserClick = {},
                    onRefresh = {},
                    onRetry = {}
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("John Doe").assertIsDisplayed()
        composeTestRule.onNodeWithText("Jane Smith").assertIsDisplayed()
    }

    @Test
    fun userListScreen_callsOnUserClick_whenUserItemIsClicked() {
        // Given
        val users = listOf(
            User(id = 1, name = "John Doe", email = "john@example.com", isActive = true)
        )
        val state = UserListState(users = users, isLoading = false)
        val onUserClick = mockk<(Long) -> Unit>(relaxed = true)
        
        // When
        composeTestRule.setContent {
            AppTheme {
                UserListScreen(
                    state = state,
                    onUserClick = onUserClick,
                    onRefresh = {},
                    onRetry = {}
                )
            }
        }
        
        composeTestRule.onNodeWithText("John Doe").performClick()
        
        // Then
        verify { onUserClick(1) }
    }
}

// ViewModel Test
class UserListViewModelTest {

    private val getUsersUseCase = mockk<GetUsersUseCase>()
    private val viewModel = UserListViewModel(getUsersUseCase)

    @Test
    fun `loadUsers updates state correctly on success`() = runTest {
        // Given
        val users = listOf(
            User(id = 1, name = "John", email = "john@example.com", isActive = true)
        )
        coEvery { getUsersUseCase() } returns Result.success(users)

        // When
        viewModel.loadUsers()

        // Then
        assertEquals(false, viewModel.state.value.isLoading)
        assertEquals(users, viewModel.state.value.users)
        assertEquals(null, viewModel.state.value.error)
    }

    @Test
    fun `loadUsers updates state correctly on error`() = runTest {
        // Given
        val errorMessage = "Network error"
        coEvery { getUsersUseCase() } returns Result.failure(Exception(errorMessage))

        // When
        viewModel.loadUsers()

        // Then
        assertEquals(false, viewModel.state.value.isLoading)
        assertEquals(emptyList(), viewModel.state.value.users)
        assertEquals(errorMessage, viewModel.state.value.error)
    }
}
```

## 🔄 ViewModel Pattern

### State Management Implementation

```kotlin
package com.{{projectName}}.presentation.user

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.{{projectName}}.domain.usecase.GetUsersUseCase
import com.{{projectName}}.domain.usecase.SearchUsersUseCase
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class UserListViewModel(
    private val getUsersUseCase: GetUsersUseCase,
    private val searchUsersUseCase: SearchUsersUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(UserListState())
    val state: StateFlow<UserListState> = _state.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    init {
        loadUsers()
        
        // Setup search with debouncing
        _searchQuery
            .debounce(300)
            .distinctUntilChanged()
            .onEach { query ->
                if (query.isNotBlank()) {
                    searchUsers(query)
                } else {
                    loadUsers()
                }
            }
            .launchIn(viewModelScope)
    }

    fun loadUsers() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            getUsersUseCase()
                .onSuccess { users ->
                    _state.update { 
                        it.copy(
                            users = users,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                .onFailure { exception ->
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Unknown error occurred"
                        )
                    }
                }
        }
    }

    fun searchUsers(query: String) {
        _searchQuery.value = query
        
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            
            searchUsersUseCase(query)
                .onSuccess { users ->
                    _state.update { 
                        it.copy(
                            users = users,
                            isLoading = false,
                            error = null,
                            searchQuery = query
                        )
                    }
                }
                .onFailure { exception ->
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Search failed"
                        )
                    }
                }
        }
    }

    fun clearSearch() {
        _searchQuery.value = ""
        loadUsers()
    }

    fun retryLoad() {
        if (_searchQuery.value.isNotBlank()) {
            searchUsers(_searchQuery.value)
        } else {
            loadUsers()
        }
    }
}
```

## 🔐 Dependency Injection with Koin

### Module Configuration

```kotlin
package com.{{projectName}}.di

import com.{{projectName}}.data.local.UserLocalDataSource
import com.{{projectName}}.data.remote.UserRemoteDataSource
import com.{{projectName}}.data.repository.UserRepositoryImpl
import com.{{projectName}}.domain.repository.UserRepository
import com.{{projectName}}.domain.usecase.GetUsersUseCase
import com.{{projectName}}.domain.usecase.CreateUserUseCase
import com.{{projectName}}.presentation.user.UserListViewModel
import com.{{projectName}}.presentation.user.UserDetailViewModel
import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val networkModule = module {
    single {
        HttpClient {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                })
            }
            install(Logging) {
                level = LogLevel.INFO
            }
        }
    }
}

val dataModule = module {
    single<UserRepository> { UserRepositoryImpl(get(), get()) }
    single { UserLocalDataSource(get()) }
    single { UserRemoteDataSource(get()) }
}

val domainModule = module {
    factory { GetUsersUseCase(get()) }
    factory { CreateUserUseCase(get()) }
    factory { SearchUsersUseCase(get()) }
}

val presentationModule = module {
    viewModel { UserListViewModel(get(), get()) }
    viewModel { (userId: Long) -> UserDetailViewModel(userId, get(), get()) }
}

val appModule = listOf(
    networkModule,
    dataModule,
    domainModule,
    presentationModule
)
```

## 💅 Code Style & Quality

### Detekt Configuration

```yaml
# detekt.yml
build:
  maxIssues: 0

complexity:
  LongMethod:
    threshold: 30
  LongParameterList:
    functionThreshold: 5
  TooManyFunctions:
    thresholdInFiles: 15
    thresholdInClasses: 15

style:
  MaxLineLength:
    maxLineLength: 120
  FunctionNaming:
    functionPattern: '[a-z][a-zA-Z0-9]*'
  ClassNaming:
    classPattern: '[A-Z][a-zA-Z0-9]*'

naming:
  VariableNaming:
    variablePattern: '[a-z][a-zA-Z0-9]*'
  ConstantNaming:
    constantPattern: '[A-Z][_A-Z0-9]*'
```

## 📋 Development Commands

```kotlin
// build.gradle.kts
plugins {
    kotlin("multiplatform")
    id("org.jetbrains.compose")
    id("com.android.application")
    kotlin("plugin.serialization")
    id("io.gitlab.arturbosch.detekt")
}

kotlin {
    androidTarget()
    jvm("desktop")
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(compose.runtime)
                implementation(compose.foundation)
                implementation(compose.material3)
                implementation(compose.ui)
                implementation(compose.components.resources)
                
                // Coroutines
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                
                // Serialization
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
                
                // HTTP Client
                implementation("io.ktor:ktor-client-core:2.3.5")
                implementation("io.ktor:ktor-client-content-negotiation:2.3.5")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.5")
                
                // DI
                implementation("io.insert-koin:koin-core:3.5.0")
                implementation("io.insert-koin:koin-compose:1.1.0")
                
                // ViewModel
                implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
            }
        }
        
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
                implementation("io.mockk:mockk:1.13.8")
                implementation("io.insert-koin:koin-test:3.5.0")
            }
        }
    }
}
```

```bash
# Development commands
./gradlew run                           # Run desktop app
./gradlew installDebug                  # Install Android app
./gradlew iosSimulatorArm64Test        # Run iOS tests
./gradlew test                          # Run all tests
./gradlew detekt                        # Run static analysis
./gradlew koverHtmlReport              # Generate coverage report
```

## 🗄️ Data Layer & Repository Pattern

### Repository Implementation

```kotlin
package com.{{projectName}}.data.repository

import com.{{projectName}}.data.local.UserLocalDataSource
import com.{{projectName}}.data.remote.UserRemoteDataSource
import com.{{projectName}}.data.mapper.toUser
import com.{{projectName}}.data.mapper.toUserEntity
import com.{{projectName}}.domain.model.User
import com.{{projectName}}.domain.repository.UserRepository
import kotlinx.coroutines.flow.*

class UserRepositoryImpl(
    private val localDataSource: UserLocalDataSource,
    private val remoteDataSource: UserRemoteDataSource
) : UserRepository {

    override fun getUsers(): Flow<List<User>> = flow {
        // Emit cached data first
        localDataSource.getUsers().collect { cachedUsers ->
            if (cachedUsers.isNotEmpty()) {
                emit(cachedUsers.map { it.toUser() })
            }
            
            try {
                // Fetch fresh data from remote
                val remoteUsers = remoteDataSource.getUsers()
                
                // Update local cache
                localDataSource.insertUsers(remoteUsers.map { it.toUserEntity() })
                
                // Emit fresh data
                emit(remoteUsers.map { it.toUser() })
            } catch (e: Exception) {
                // If we have cached data, continue with that
                if (cachedUsers.isEmpty()) {
                    throw e
                }
            }
        }
    }

    override suspend fun getUserById(id: Long): Result<User> = try {
        val localUser = localDataSource.getUserById(id)
        if (localUser != null) {
            Result.success(localUser.toUser())
        } else {
            val remoteUser = remoteDataSource.getUserById(id)
            localDataSource.insertUser(remoteUser.toUserEntity())
            Result.success(remoteUser.toUser())
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    override suspend fun createUser(user: User): Result<User> = try {
        val createdUser = remoteDataSource.createUser(user.toUserDto())
        localDataSource.insertUser(createdUser.toUserEntity())
        Result.success(createdUser.toUser())
    } catch (e: Exception) {
        Result.failure(e)
    }

    override suspend fun searchUsers(query: String): Result<List<User>> = try {
        val results = remoteDataSource.searchUsers(query)
        Result.success(results.map { it.toUser() })
    } catch (e: Exception) {
        // Fallback to local search
        val localResults = localDataSource.searchUsers(query)
        Result.success(localResults.map { it.toUser() })
    }
}

// Local Data Source with SQLDelight
class UserLocalDataSource(private val database: AppDatabase) {
    
    fun getUsers(): Flow<List<UserEntity>> = 
        database.userQueries.selectAll().asFlow().mapToList()
    
    suspend fun getUserById(id: Long): UserEntity? =
        database.userQueries.selectById(id).executeAsOneOrNull()
    
    suspend fun insertUser(user: UserEntity) {
        database.userQueries.insert(
            id = user.id,
            name = user.name,
            email = user.email,
            isActive = user.isActive
        )
    }
    
    suspend fun insertUsers(users: List<UserEntity>) {
        database.transaction {
            users.forEach { insertUser(it) }
        }
    }
    
    suspend fun searchUsers(query: String): List<UserEntity> =
        database.userQueries.searchByNameOrEmail("%$query%").executeAsList()
}

// Remote Data Source with Ktor
class UserRemoteDataSource(private val httpClient: HttpClient) {
    
    suspend fun getUsers(): List<UserDto> =
        httpClient.get("${ApiConstants.BASE_URL}/users").body()
    
    suspend fun getUserById(id: Long): UserDto =
        httpClient.get("${ApiConstants.BASE_URL}/users/$id").body()
    
    suspend fun createUser(user: UserCreateDto): UserDto =
        httpClient.post("${ApiConstants.BASE_URL}/users") {
            contentType(ContentType.Application.Json)
            setBody(user)
        }.body()
    
    suspend fun searchUsers(query: String): List<UserDto> =
        httpClient.get("${ApiConstants.BASE_URL}/users/search") {
            parameter("q", query)
        }.body()
}
```

## ⚠️ CRITICAL GUIDELINES

1. **ALWAYS use StateFlow for state management** - Not mutable state in composables
2. **VALIDATE all user inputs** - Use proper validation in state classes
3. **MINIMUM 80% test coverage** - Include UI tests with Compose Test
4. **USE proper navigation** - Use Compose Navigation or Voyager
5. **HANDLE platform differences** - Use expect/actual declarations
6. **NEVER expose data classes directly** - Always use proper domain models

## 📋 Pre-commit Checklist

- [ ] All tests passing with 80%+ coverage
- [ ] Detekt analysis passes
- [ ] No hardcoded values (use BuildConfig or resources)
- [ ] Proper error handling in all layers
- [ ] Platform-specific code properly abstracted
- [ ] Navigation flows working correctly
- [ ] Accessibility considerations addressed
- [ ] Performance optimizations applied (remember/LaunchedEffect usage)

## Platform-Specific Implementation

### Expect/Actual Pattern

```kotlin
// commonMain
expect class PlatformContext

expect fun getPlatformContext(): PlatformContext

expect fun PlatformContext.showToast(message: String)

expect fun PlatformContext.shareText(text: String)

// androidMain
actual typealias PlatformContext = Context

actual fun getPlatformContext(): PlatformContext {
    return LocalContext.current
}

actual fun PlatformContext.showToast(message: String) {
    Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
}

actual fun PlatformContext.shareText(text: String) {
    val shareIntent = Intent().apply {
        action = Intent.ACTION_SEND
        putExtra(Intent.EXTRA_TEXT, text)
        type = "text/plain"
    }
    startActivity(Intent.createChooser(shareIntent, "Share"))
}

// iosMain
actual typealias PlatformContext = Unit

actual fun getPlatformContext(): PlatformContext = Unit

actual fun PlatformContext.showToast(message: String) {
    // iOS toast implementation
}

actual fun PlatformContext.shareText(text: String) {
    // iOS share implementation
}
```

## Navigation Pattern

### Screen Navigation with Type Safety

```kotlin
package com.{{projectName}}.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.UserList.route
    ) {
        composable(Screen.UserList.route) {
            UserListScreen(
                onUserClick = { userId ->
                    navController.navigate(Screen.UserDetail.createRoute(userId))
                },
                onCreateUser = {
                    navController.navigate(Screen.CreateUser.route)
                }
            )
        }
        
        composable(
            route = Screen.UserDetail.route,
            arguments = Screen.UserDetail.arguments
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getLong("userId") ?: return@composable
            UserDetailScreen(
                userId = userId,
                onBack = { navController.popBackStack() },
                onEdit = { 
                    navController.navigate(Screen.EditUser.createRoute(userId))
                }
            )
        }
        
        composable(Screen.CreateUser.route) {
            CreateUserScreen(
                onBack = { navController.popBackStack() },
                onUserCreated = { 
                    navController.popBackStack()
                }
            )
        }
    }
}

sealed class Screen(val route: String) {
    object UserList : Screen("user_list")
    
    object UserDetail : Screen("user_detail/{userId}") {
        fun createRoute(userId: Long) = "user_detail/$userId"
        val arguments = listOf(
            navArgument("userId") { type = NavType.LongType }
        )
    }
    
    object CreateUser : Screen("create_user")
    
    object EditUser : Screen("edit_user/{userId}") {
        fun createRoute(userId: Long) = "edit_user/$userId"
        val arguments = listOf(
            navArgument("userId") { type = NavType.LongType }
        )
    }
}
```

## Workflow Rules

### Before Starting Any Task

- Consult `/Docs/Implementation.md` for current stage and available tasks
- Check Compose Multiplatform version compatibility
- Review existing patterns in codebase
- Ensure platform-specific implementations are properly abstracted

### Compose Multiplatform Development Flow

1. Define domain models and use cases
2. Implement repository pattern with local/remote data sources
3. Create ViewModels with proper state management
4. Build reusable UI components
5. Implement screen composables with proper state handling
6. Add navigation between screens
7. Write comprehensive tests for all layers
8. Add platform-specific implementations where needed

{{#if prpConfig}}

### PRP Workflow

- Check `/PRPs/` directory for detailed implementation prompts
- Follow validation loops defined in PRPs
- Use ai_docs/ for Compose Multiplatform documentation
  {{/if}}
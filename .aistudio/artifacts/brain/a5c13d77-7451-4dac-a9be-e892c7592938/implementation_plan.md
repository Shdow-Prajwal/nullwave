# Implementation Plan - Landing Page, Relational User Persistence, and 8D Taste Vector Integration

## 1. DDL Cleanup
- **File:** `src/services/vectorDb/schemaSql.ts`
- **Action:** Remove `DEFAULT` clauses from the DDL tables (e.g., `DEFAULT 0.0` in `audio_features`, `DEFAULT 'main'` in `performs`, `DEFAULT CURRENT_TIMESTAMP` in `users`, `playlists`, `playlist_tracks`, `listen_history`) while retaining all constraints (`PRIMARY KEY`, `REFERENCES`, `CHECK`, `NOT NULL`, `UNIQUE`).
- Update the live SQL query generator in `src/services/vectorDb/pgVectorSimulator.ts` and `PgVectorArchitectureDrawer.tsx` to reflect the clean DDL definitions.

## 2. Landing / Splash Screen & First-Time Onboarding
- **New Component:** `src/components/LandingPage.tsx`
- **Features:**
  - Modern, dark-luxury aesthetic matching the app's violet/indigo design.
  - Interactive hero section highlighting 8D vector embedding, pgvector similarity, and acoustic curation.
  - Primary call-to-action button to enter the recommender.
  - **First-Time User Prompt:** If no user profile exists in the relational store, opens a sleek modal asking for the user's name and email handle.
  - **Returning User Experience:** Shows a personalized greeting (*"Welcome back, [Name]"*) with quick-launch access and an option to switch user profiles.

## 3. Relational Database Client Store & Slider Synchronization
- **New/Updated Store:** `src/services/vectorDb/userStore.ts`
  - Implements client-side relational storage mirroring the `users` table:
    ```sql
    CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL,
        taste_vector VECTOR(8)
    );
    ```
  - Persists the active user's `taste_vector` directly when sliders are adjusted.
  - Provides reactive updates so adjusting Energy, Danceability, Valence, Acousticness, Instrumentalness, Liveness, Speechiness, or Tempo instantly updates `users.taste_vector` in the database and re-runs the pgvector KNN search.
  - Displays real-time database sync indicators (e.g. *"Updated users.taste_vector in PostgreSQL state"*).

## 4. Top-Right User Header & Interactive Dropdown
- **Component Update:** `src/components/UserHeaderMenu.tsx` (integrated into `App.tsx`)
  - Positioned in the top right header:
    - User avatar badge with username and user ID.
    - Taste profile summary indicator directly beneath the user badge.
  - **Dropdown Menu:**
    1. **Settings Dialog:** Modal to configure pgvector search parameters (distance metric: Cosine `<=>`, L2 `<->`, Inner Product `<#>`; index selection; result limit `k`).
    2. **Taste Profile Dialog:** Modal showcasing the complete 8-dimensional audio radar/bar fingerprint, affinity scores, and calibration presets.
    3. **User Details Dialog:** Modal displaying the actual relational record (`user_id`, `username`, `email`, `created_at`, raw 8D vector floats `[v1, ..., v8]`, and listening session metrics).

## 5. Verification & Testing
- Verify seamless navigation between landing screen and main application.
- Test first-time onboarding modal with username input and profile creation.
- Verify slider adjustments persist directly into `users.taste_vector` and trigger vector recommendation updates.
- Verify all three modal dialogs (Settings, Taste Profile, User Details) open and interact smoothly without UI conflicts.
- Run `lint_applet` and `compile_applet` to confirm zero build or TypeScript errors.

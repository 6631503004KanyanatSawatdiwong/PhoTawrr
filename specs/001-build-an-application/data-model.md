# Data Model: Photo Album Organization Application

**Date**: 20 September 2025  
**Feature**: Photo Album Organization Application  
**Phase**: 1 - Design & Contracts

## Entity Definitions

### Photo Entity
**Purpose**: Represents an individual photo file with its metadata and organizational information.

**Fields**:
- `id`: INTEGER PRIMARY KEY - Unique identifier for the photo
- `file_path`: TEXT NOT NULL - Absolute path to the photo file on local system
- `file_name`: TEXT NOT NULL - Original filename of the photo
- `file_size`: INTEGER - File size in bytes
- `date_taken`: DATETIME - Date when photo was taken (from EXIF data)
- `date_added`: DATETIME DEFAULT CURRENT_TIMESTAMP - When photo was added to system
- `album_id`: INTEGER - Foreign key reference to album
- `width`: INTEGER - Original photo width in pixels
- `height`: INTEGER - Original photo height in pixels
- `thumbnail_data`: BLOB - Base64 encoded thumbnail image data
- `exif_data`: TEXT - JSON string of additional EXIF metadata

**Validation Rules**:
- `file_path` must be unique
- `file_name` cannot be empty
- `file_size` must be positive
- `date_taken` can be NULL (for photos without EXIF date)
- `album_id` must reference valid album
- `width` and `height` must be positive integers

**Relationships**:
- Belongs to one Album (many-to-one)

### Album Entity
**Purpose**: Container for photos grouped by date with display ordering.

**Fields**:
- `id`: INTEGER PRIMARY KEY - Unique identifier for the album
- `name`: TEXT NOT NULL - Display name for the album (e.g., "January 2025")
- `date_period`: TEXT NOT NULL - Date period identifier (YYYY-MM format)
- `display_order`: INTEGER DEFAULT 0 - Order position on main page
- `photo_count`: INTEGER DEFAULT 0 - Cached count of photos in album
- `cover_photo_id`: INTEGER - Foreign key to photo used as album cover
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Album creation timestamp
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last modification timestamp

**Validation Rules**:
- `name` cannot be empty
- `date_period` must follow YYYY-MM format or be "undated"
- `display_order` must be non-negative
- `photo_count` must be non-negative
- `cover_photo_id` must reference valid photo if set

**Relationships**:
- Has many Photos (one-to-many)
- Cover photo belongs to this album

### User Preferences Entity
**Purpose**: Stores user interface preferences and application settings.

**Fields**:
- `id`: INTEGER PRIMARY KEY - Unique identifier
- `setting_key`: TEXT NOT NULL UNIQUE - Preference setting name
- `setting_value`: TEXT - Preference setting value (JSON string)
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last update timestamp

**Validation Rules**:
- `setting_key` must be unique
- `setting_value` must be valid JSON

**Common Settings**:
- `thumbnail_size`: Preferred thumbnail dimensions
- `albums_per_row`: Number of albums displayed per row
- `sort_direction`: Album sorting direction (asc/desc)
- `view_mode`: Current view mode (grid/list)

## Database Schema

### SQLite Table Definitions

```sql
-- Albums table
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date_period TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    photo_count INTEGER DEFAULT 0,
    cover_photo_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id)
);

-- Photos table
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    date_taken DATETIME,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    album_id INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    thumbnail_data BLOB,
    exif_data TEXT,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_date_taken ON photos(date_taken);
CREATE INDEX idx_albums_display_order ON albums(display_order);
CREATE INDEX idx_albums_date_period ON albums(date_period);
```

## State Transitions

### Photo Import Flow
1. **Initial**: Photo file selected by user
2. **Reading**: EXIF data extraction in progress
3. **Processing**: Thumbnail generation in progress
4. **Categorizing**: Album assignment based on date
5. **Stored**: Photo metadata saved to database
6. **Displayed**: Photo appears in appropriate album

### Album Reordering Flow
1. **Initial**: Album in current position
2. **Dragging**: User initiates drag operation
3. **Hovering**: Album position preview shown
4. **Dropping**: New position confirmed
5. **Updating**: Database display_order values updated
6. **Refreshed**: UI reflects new album order

### Album Creation Flow
1. **Trigger**: Photo with new date period imported
2. **Creation**: New album record created
3. **Assignment**: Photo assigned to new album
4. **Positioning**: Album placed in chronological order
5. **Display**: Album appears on main page

## Data Validation Rules

### File Path Validation
- Must be absolute path
- Must point to existing file
- Must be image file type (jpg, jpeg, png, heic, tiff)
- Must be unique across all photos

### Date Period Validation
- Format: YYYY-MM for dated photos
- Special value: "undated" for photos without date metadata
- Must be valid calendar month (01-12)
- Year must be reasonable (1900-current year + 1)

### Display Order Validation
- Must be non-negative integer
- Gaps in sequence are allowed
- Duplicate values will be resolved by creation order

### Thumbnail Data Validation
- Must be valid base64 encoded image data
- Recommended format: JPEG at 200x200 pixels
- Maximum size: 50KB per thumbnail

## Business Rules

### Album Organization Rules
1. Each photo belongs to exactly one album
2. Albums are automatically created based on photo dates
3. Photos without date metadata go to "Undated" album
4. Album names are human-readable date formats
5. Albums cannot be nested (flat structure only)

### Performance Rules
1. Maximum 10,000 photos total
2. Maximum 500 photos per album for optimal loading
3. Thumbnail cache limited to 100 images in memory
4. Database queries must use appropriate indexes

### Data Integrity Rules
1. Deleting album cascades to delete all contained photos
2. Cover photo must belong to the same album
3. Photo file paths must remain valid (no broken links)
4. Album photo count must match actual photo count

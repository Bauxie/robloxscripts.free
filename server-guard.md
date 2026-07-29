# Server + database enforcement

The client form is a convenience. Anyone can `POST` straight to your endpoint
and skip it. These two layers are what actually enforce the rules.

---

## Layer 2 — API route

### Next.js App Router (`app/api/scripts/route.js`)

```js
import { NextResponse } from 'next/server';
import { validateUpload } from '@/lib/uploadValidation';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to upload.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const { valid, errors, cleaned } = validateUpload(payload);
  if (!valid) {
    return NextResponse.json({ error: 'Validation failed.', errors }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      title: cleaned.title,
      description: cleaned.description,
      game_name: cleaned.gameName,
      tags: cleaned.tags,
      executors: cleaned.executors,
      source: cleaned.source,
      key_system: cleaned.keySystem,
      author_id: user.id,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23514') {
      return NextResponse.json({ error: 'Upload rejected by content rules.' }, { status: 422 });
    }
    console.error('script insert failed', error);
    return NextResponse.json({ error: 'Could not save the script.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
```

### Express (`routes/scripts.js`)

```js
const express = require('express');
const { validateUpload } = require('../lib/uploadValidation');

const router = express.Router();

router.post('/scripts', requireAuth, async (req, res) => {
  const { valid, errors, cleaned } = validateUpload(req.body);
  if (!valid) {
    return res.status(422).json({ error: 'Validation failed.', errors });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO scripts
         (title, description, game_name, tags, executors, source, key_system, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        cleaned.title,
        cleaned.description,
        cleaned.gameName,
        cleaned.tags,
        cleaned.executors,
        cleaned.source,
        cleaned.keySystem,
        req.user.id,
      ]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(422).json({ error: 'Upload rejected by content rules.' });
    }
    console.error('script insert failed', err);
    res.status(500).json({ error: 'Could not save the script.' });
  }
});

module.exports = router;
```

### PHP (`api/upload.php`)

```php
<?php
require __DIR__ . '/../lib/validate.php';

header('Content-Type: application/json');

$payload = json_decode(file_get_contents('php://input'), true) ?? [];
[$valid, $errors, $cleaned] = validate_upload($payload);

if (!$valid) {
    http_response_code(422);
    echo json_encode(['error' => 'Validation failed.', 'errors' => $errors]);
    exit;
}

$stmt = $pdo->prepare(
    'INSERT INTO scripts (title, description, game_name, tags, executors, source, key_system, author_id)
     VALUES (:title, :description, :game_name, :tags, :executors, :source, :key_system, :author_id)'
);
$stmt->execute([
    ':title'       => $cleaned['title'],
    ':description' => $cleaned['description'],
    ':game_name'   => $cleaned['gameName'],
    ':tags'        => json_encode($cleaned['tags']),
    ':executors'   => json_encode($cleaned['executors']),
    ':source'      => $cleaned['source'],
    ':key_system'  => $cleaned['keySystem'] ? 1 : 0,
    ':author_id'   => $userId,
]);

http_response_code(201);
echo json_encode(['id' => $pdo->lastInsertId()]);
```

---

## Layer 3 — Database constraints

Last line of defense. Even a direct `INSERT` from a SQL console gets rejected.

### PostgreSQL / Supabase

```sql
ALTER TABLE scripts
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN source      SET NOT NULL,
  ALTER COLUMN tags        SET DEFAULT '{}',
  ALTER COLUMN executors   SET DEFAULT '{}';

ALTER TABLE scripts
  ADD CONSTRAINT description_min_length
    CHECK (char_length(btrim(description)) >= 20),

  ADD CONSTRAINT description_min_words
    CHECK (array_length(regexp_split_to_array(btrim(description), '\s+'), 1) >= 4),

  ADD CONSTRAINT tags_min_count
    CHECK (array_length(tags, 1) >= 1),

  ADD CONSTRAINT executors_min_count
    CHECK (array_length(executors, 1) >= 2),

  ADD CONSTRAINT source_not_empty
    CHECK (char_length(btrim(source)) >= 10);
```

Existing rows that violate these will block the migration. Clean them first:

```sql
-- See what breaks before you run the ALTER
SELECT id, title,
       char_length(btrim(coalesce(description, ''))) AS desc_len,
       coalesce(array_length(tags, 1), 0)            AS tag_count,
       coalesce(array_length(executors, 1), 0)       AS exec_count,
       char_length(btrim(coalesce(source, '')))      AS src_len
FROM scripts
WHERE char_length(btrim(coalesce(description, ''))) < 20
   OR coalesce(array_length(tags, 1), 0) < 1
   OR coalesce(array_length(executors, 1), 0) < 2
   OR char_length(btrim(coalesce(source, ''))) < 10;
```

Two options for the offenders:

```sql
-- Option A: quarantine them so the constraint can land
UPDATE scripts SET status = 'needs_review'
WHERE char_length(btrim(coalesce(description, ''))) < 20;

-- Option B: backfill from cardFallbacks.deriveDescription() output,
-- then re-run the SELECT above to confirm zero rows remain.
```

Then add the constraints with `NOT VALID` if you want them enforced on new rows
only while you clean up the backlog:

```sql
ALTER TABLE scripts
  ADD CONSTRAINT description_min_length
  CHECK (char_length(btrim(description)) >= 20) NOT VALID;

-- Later, once the backlog is clean:
ALTER TABLE scripts VALIDATE CONSTRAINT description_min_length;
```

### MySQL 8.0+

```sql
ALTER TABLE scripts
  MODIFY description TEXT NOT NULL,
  MODIFY source LONGTEXT NOT NULL,
  ADD CONSTRAINT description_min_length CHECK (CHAR_LENGTH(TRIM(description)) >= 20),
  ADD CONSTRAINT source_not_empty       CHECK (CHAR_LENGTH(TRIM(source)) >= 10),
  ADD CONSTRAINT tags_min_count         CHECK (JSON_LENGTH(tags) >= 1),
  ADD CONSTRAINT executors_min_count    CHECK (JSON_LENGTH(executors) >= 2);
```

---

## Handling the 422 on the client

`UploadForm.jsx` already surfaces whatever `onSubmit` throws. Wire it like this:

```js
async function submitScript(cleaned) {
  const res = await fetch('/api/scripts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const first = body.errors ? Object.values(body.errors)[0] : null;
    throw new Error(first || body.error || 'Upload failed.');
  }

  return res.json();
}
```

```jsx
<UploadForm onSubmit={submitScript} />
```

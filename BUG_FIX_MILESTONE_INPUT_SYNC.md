# Bug Fix: Milestone Input Fields Syncing Issue

**Date:** November 9, 2025
**Component:** `ProgressTracker.tsx`
**Issue:** Multiple milestone upload forms sharing the same state

## Problem Description

In the "In Progress" tab of the project details view (Explore Projects), when editing milestone information (description, images, videos), the changes were affecting **all milestones** instead of just the one being edited.

### Root Cause

The component had these state variables at the top level:

```tsx
const [uploadDescription, setUploadDescription] = useState("");
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
```

These same variables were used in **ALL milestone upload forms**, so when you typed in one milestone's description input, it updated the shared state and affected all other milestone forms!

## Solution

Changed the state management from shared to **per-milestone** using an object keyed by milestone ID:

### Before:
```tsx
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
const [uploadDescription, setUploadDescription] = useState("");
```

### After:
```tsx
// Per-milestone upload state - each milestone has its own description, images, and videos
const [milestoneUploads, setMilestoneUploads] = useState<Record<string, {
  description: string;
  images: File[];
  videos: File[];
}>>({});

// Helper functions to get and set per-milestone data
const getMilestoneData = (milestoneId: string) => {
  return milestoneUploads[milestoneId] || { description: "", images: [], videos: [] };
};

const updateMilestoneData = (milestoneId: string, field: 'description' | 'images' | 'videos', value: any) => {
  setMilestoneUploads(prev => ({
    ...prev,
    [milestoneId]: {
      ...getMilestoneData(milestoneId),
      [field]: value
    }
  }));
};

const clearMilestoneData = (milestoneId: string) => {
  setMilestoneUploads(prev => {
    const newState = { ...prev };
    delete newState[milestoneId];
    return newState;
  });
};
```

## Changes Made

### 1. Input Fields (Per Milestone)
```tsx
// Before:
<input
  value={uploadDescription}
  onChange={(e) => setUploadDescription(e.target.value)}
/>

// After:
<input
  value={getMilestoneData(milestone.id).description}
  onChange={(e) => updateMilestoneData(milestone.id, "description", e.target.value)}
/>
```

### 2. File Selection
```tsx
// Before:
<input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => setSelectedImages(Array.from(e.target.files || []))}
/>

// After:
<input
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => updateMilestoneData(milestone.id, "images", Array.from(e.target.files || []))}
/>
```

### 3. Upload Handler
```tsx
// Before:
const handleUpload = async (milestoneId: string) => {
  if (selectedImages.length === 0 && selectedVideos.length === 0) {
    // ...
  }
  selectedImages.forEach((file) => formData.append("images", file));
  selectedVideos.forEach((file) => formData.append("videos", file));
  // ...
};

// After:
const handleUpload = async (milestoneId: string) => {
  const milestoneData = getMilestoneData(milestoneId);
  
  if (milestoneData.images.length === 0 && milestoneData.videos.length === 0) {
    // ...
  }
  milestoneData.images.forEach((file) => formData.append("images", file));
  milestoneData.videos.forEach((file) => formData.append("videos", file));
  // ...
};
```

### 4. Clear Button
```tsx
// Before:
<Button onClick={() => {
  setSelectedImages([]);
  setSelectedVideos([]);
  setUploadDescription("");
}}>
  Clear
</Button>

// After:
<Button onClick={() => clearMilestoneData(milestone.id)}>
  Clear
</Button>
```

## Testing

To verify the fix:

1. Navigate to **Explore Projects** page
2. Click **"View Details"** on any project
3. Go to the **"In Progress"** tab (if milestones exist)
4. As a builder, try typing in the description field of one milestone
5. Verify that **other milestones** remain unchanged
6. Upload different images/videos to different milestones
7. Verify each milestone maintains its own separate data

## Benefits

✅ Each milestone now has its own independent form state
✅ No more unintended data syncing between milestones
✅ Cleaner code with helper functions
✅ Better user experience
✅ No TypeScript errors

## Files Modified

- `/frontend/src/components/ProgressTracker.tsx`

## Related Components

This component is used in:
- `ProjectOverview.tsx` - Project details page accessible from Explore Projects
- Any page that displays milestone progress tracking

# Auto-Hide Header on Scroll - Implementation

## Feature
Smart header that automatically hides when scrolling down and shows when scrolling up on mobile.

## User Requirements
1. ✅ **Show header by default** - Brand logo must be visible
2. ✅ **Hide when scrolling down** - More screen space for content
3. ✅ **Show when scrolling up** - Easy access to navigation
4. ✅ **Apply to ALL pages** - Consistent behavior across the app

## Implementation Details

### File: `components/layouts/MobileLayout.tsx`

**Key Features**:
1. **Scroll Direction Detection**
   - Tracks scroll position using `useRef(lastScrollY)`
   - Compares current scroll position with previous
   - Determines if user is scrolling up or down

2. **Performance Optimization**
   - Uses `requestAnimationFrame` for smooth updates
   - Prevents multiple state updates per frame with `ticking` flag
   - Passive event listener for better scroll performance

3. **Smart Thresholds**
   - Shows header when: `scrollY < 10px` (near top)
   - Shows header when: scrolling up (any direction change)
   - Hides header when: scrolling down AND `scrollY > 64px` (past header height)

4. **Smooth Animation**
   - CSS transition: `duration-300` (300ms)
   - Transform: `translate-y-0` (visible) or `-translate-y-full` (hidden)
   - Sticky positioning ensures header stays at top

### Code Breakdown

```typescript
const [isHeaderVisible, setIsHeaderVisible] = useState(true); // Header visible by default
const lastScrollY = useRef(0); // Track last scroll position
const ticking = useRef(false); // Prevent multiple RAF calls

useEffect(() => {
  const handleScroll = () => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Logic:
        // 1. If scrolling up OR near top → Show header
        if (currentScrollY < lastScrollY.current || currentScrollY < 10) {
          setIsHeaderVisible(true);
        }
        // 2. If scrolling down AND past header height → Hide header
        else if (currentScrollY > lastScrollY.current && currentScrollY > 64) {
          setIsHeaderVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      ticking.current = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### CSS Classes Used

```typescript
<div className={`sticky top-0 z-50 transition-transform duration-300 ${
  isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
}`}>
  <Header />
</div>
```

**Breakdown**:
- `sticky top-0` - Header sticks to top of viewport
- `z-50` - High z-index to stay above content
- `transition-transform duration-300` - Smooth 300ms animation
- `translate-y-0` - Visible position (no offset)
- `-translate-y-full` - Hidden position (moved up by 100% of its height)

## Behavior

### Scenario 1: Page Load
- ✅ Header is **visible**
- ✅ Brand logo shows prominently

### Scenario 2: Scrolling Down
1. User scrolls down
2. After scrolling past 64px (header height)
3. Header **slides up** and disappears
4. More screen space for content

### Scenario 3: Scrolling Up
1. User scrolls up (even 1px)
2. Header **slides down** immediately
3. Logo and navigation accessible

### Scenario 4: At Top of Page
- Header is **always visible** when `scrollY < 10px`
- Prevents flickering at the top

## Performance Considerations

1. **requestAnimationFrame**: Throttles updates to 60fps max
2. **ticking flag**: Prevents multiple state updates per scroll event
3. **Passive listener**: Browser can optimize scroll performance
4. **CSS transforms**: Hardware-accelerated animation (GPU)
5. **Refs instead of state**: `lastScrollY` doesn't trigger re-renders

## Mobile UX Benefits

✅ **More content visible** when scrolling down
✅ **Brand always accessible** when at top or scrolling up
✅ **Smooth animations** enhance feel
✅ **Familiar pattern** used by major apps (Instagram, Twitter)
✅ **No manual toggle** needed - automatic behavior

## Desktop Behavior
This feature is implemented in `MobileLayout.tsx`, so it only affects mobile users. Desktop users see the normal layout with fixed header.

## Testing Checklist

- [x] Header visible on page load
- [x] Header hides when scrolling down
- [x] Header shows immediately when scrolling up
- [x] Header stays visible at top of page (scrollY < 10px)
- [x] Smooth animation (no jank)
- [x] Works on all mobile pages
- [x] No performance issues
- [x] Brand logo prominently displayed initially

## Result
✅ Professional mobile UX with auto-hiding header
✅ More screen real estate when scrolling
✅ Brand logo visible by default
✅ Easy access to navigation when needed

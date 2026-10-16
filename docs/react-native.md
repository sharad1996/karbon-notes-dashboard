# Adapting the dashboard to React Native

The web app keeps its data logic out of components, so most of it would move to a mobile app as it is. Only the screens would be rewritten.

## What carries over unchanged

| Folder     | Contents                                                                                              | Why it ports                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `api/`     | `client.ts`, `notes.ts`, `types.ts`                                                                   | Uses `fetch` and plain TypeScript. React Native has `fetch` built in.                                  |
| `hooks/`   | `useNotes`, the three mutation hooks, `noteCache`, `useFilteredNotes`, `usePagination`, `useDebounce` | TanStack Query works the same in React Native, so optimistic updates and per-note rollback come along. |
| `context/` | `UIContext`, `ToastContext`                                                                           | Plain React state with no DOM in it.                                                                   |
| `lib/`     | `queryClient`, `constants`                                                                            | No browser APIs. (`cn` is only for class names and stays on the web.)                                  |

Two small browser-specific pieces would be dropped or replaced: `useKeyboardShortcuts`, which has no counterpart on a phone, and `searchInputRef`, which would hold a `TextInput` ref instead of an `HTMLInputElement`.

## What is rewritten

- **Elements:** `div`/`p`/`button` become `View`/`Text`/`Pressable`.
- **Grid:** a `FlatList` with `numColumns` (1 on phones, 2 on tablets) instead of the CSS grid. It virtualises long lists, so infinite scroll (`onEndReached`) would replace the numbered pages.
- **Create/edit form:** a modal screen (React Navigation) or a bottom sheet instead of `<dialog>`, wrapped in `KeyboardAvoidingView` so the keyboard doesn't cover the fields.
- **Delete:** swipe-to-delete on a card, confirmed with `Alert.alert` instead of `ConfirmDialog`.
- **Styling:** NativeWind, which keeps the Tailwind class names and the colour tokens. Dark mode follows `useColorScheme()`.
- **Toasts:** a small toast library, or the existing `ToastContext` rendered with an animated `View`.

## Mobile-specific concerns

- **API address:** `127.0.0.1` on a device or emulator is the device itself. Use `10.0.2.2` on the Android emulator and the machine's LAN IP on a real phone, set through an Expo env variable (`EXPO_PUBLIC_API_URL`). The FastAPI server would need to listen on `0.0.0.0`. CORS doesn't apply to native requests.
- **Offline:** persist the query cache with `persistQueryClient` and AsyncStorage, so notes show without a network. Paused mutations are queued and resumed when the connection returns (`onlineManager` with NetInfo).
- **Refresh:** pull-to-refresh on the `FlatList` (`refreshing={isFetching}`, `onRefresh={refetch}`). Refetch when the app returns to the foreground via `focusManager` and `AppState`, in place of the web's window-focus refetch.
- **Touch:** cards need no hover states. Edit and delete stay visible, as they already are on touch screens in the web app.

## Suggested structure

An Expo app in a monorepo next to the web app, with the shared code moved into a package:

```
apps/web/        # this Vite app, components only
apps/mobile/     # Expo app, screens only
packages/core/   # api/, hooks/, context/, lib/ — imported by both
```

A fix to the data layer, such as a change to how rollback works, then reaches both apps at once.

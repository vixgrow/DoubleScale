// Booking module shared component barrel.
//   - antd wrapper bag (CRM uses antd directly; one helper kept locally
//     as `search-input/`)
//   - navbar (CRM owns top-level chrome)
//
// `header/` is kept booking-scoped because share-modal/editor/merge-tag-modal
// import `Header` from this barrel — it's a tiny title+subtitle widget unique
// to booking pages, not the global page chrome.
//
// `pro-tab/`, `pro-version/`, `pro-global-integrations/` are kept as
// in DoubleScale Pro the actual content is wired in via `applyFilters`
// during Phase 3b's QB-Pro admin component merge. Until then the placeholders
// render a neutral "coming soon" notice so admin tabs don't appear broken.

export * from './icons';
export { default as Header } from './header';
export { default as HostSelect } from './host-select';
export { default as TimezoneSelect } from './timezone-select';
export { default as FieldWrapper } from './field-wrapper';
export { default as EventSelect } from './event-select';
export { default as TextField } from './text-field';
export { default as OverrideSection } from './override-section';
export { default as OverrideModal } from './override-modal';
export { default as ProductSelect } from './product-select';
export { default as CurrentTimeInTimezone } from './current-time';
export { default as DynamicFormField } from './dynamic-fields';
export { default as MultiSelect } from './multi-select';
export { default as BookingActions } from './booking-actions';
export { default as CardHeader } from './card-header';
export { default as Schedule } from './schedule';
export { default as MergeTagModal } from './merge-tag-modal';
export { default as Editor } from './editor';
export { default as NoticeComponent } from './notice';
export { default as NotificationRow } from './notification-row';
export { default as TagComponent } from './tag';
export { default as SelectTimezone } from './select-timezone';
export { default as ConfirmationModal } from './confirmation-modal';
export { default as NoDataComponent } from './no-data';
export { default as NoticeBanner } from './notice-banner';
export { default as TabButtons } from './tab-buttons';
export { default as Locations } from './locations';
export { default as ColorSelector } from './color-selector';
export { default as ShareModal } from './share-modal';
export { default as EventPrice } from './event-price';
export { default as SelectionCard } from './selection-card';
export { default as LocationDisplay } from './location-display';
export { default as EventUrl } from './event-url';
export { default as SearchInput } from './search-input';
export { default as ProTab } from './pro-tab';
export { default as ProVersion } from './pro-version';
export { default as ProGlobalIntegrations } from './pro-global-integrations';
export { default as RadioCard } from './form-controls/radio-card';
export { default as CheckboxCard } from './form-controls/checkbox-card';

// CalendarActions lives under the calendars page since QB. Re-exported here so
// the QB-Pro `team-events` admin component can pull it from the barrel without
// a deep relative path.
export { default as CalendarActions } from '@/client/pages/booking/calendars/calendar-actions';

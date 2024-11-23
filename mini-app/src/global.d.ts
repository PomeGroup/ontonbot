declare global {
  // interface Window {
  //   Telegram: Telegram;
  // }

  interface WebAppUser {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  }

  interface WebAppChat {
    id: number;
    type: "group" | "supergroup" | "channel";
    title: string;
    username?: string;
    photo_url?: string;
  }

  interface WebAppInitData {
    query_id?: string;
    auth_date: number;
    hash: string;
    user?: WebAppUser & {
      added_to_attachment_menu?: boolean;
      allows_write_to_pm?: boolean;
    };
    receiver?: WebAppUser;
    start_param?: string;
    can_send_after?: number;
    chat?: WebAppChat;
    chat_type?: "sender" | "private" | "group" | "supergroup" | "channel";
    chat_instance?: string;
  }

  interface ThemeParams {
    bg_color: `#${string}`;
    secondary_bg_color: `#${string}`;
    text_color: `#${string}`;
    hint_color: `#${string}`;
    link_color: `#${string}`;
    button_color: `#${string}`;
    button_text_color: `#${string}`;
  }

  interface HapticFeedback {
    impactOccurred: (_style: "light" | "medium" | "heavy" | "rigid" | "soft") => HapticFeedback;
    notificationOccurred: (_type: "error" | "success" | "warning") => HapticFeedback;
    selectionChanged: () => HapticFeedback;
  }

  type CloudStorageKey = string;
  type CloudStorageValue = string;

  interface CloudStorageItems {
    [key: CloudStorageKey]: CloudStorageValue;
  }

  interface CloudStorage {
    setItem: (
      _key: CloudStorageKey,
      _value: CloudStorageValue,
      _callback?: (_error: string | null, _result?: boolean) => void
    ) => void;
    getItem: (
      _key: CloudStorageKey,
      _callback?: (_error: string | null, _result?: CloudStorageValue) => void
    ) => void;
    getItems: (
      _keys: Array<CloudStorageKey>,
      _callback?: (_error: string | null, _result?: CloudStorageItems) => void
    ) => void;
    getKeys: (_callback?: (_error: string | null, _result?: Array<CloudStorageKey>) => void) => void;
    removeItem: (
      _key: CloudStorageKey,
      _callback?: (_error: string | null, _result?: boolean) => void
    ) => void;
    removeItems: (
      _key: Array<CloudStorageKey>,
      _callback?: (_error: string | null, _result?: boolean) => void
    ) => void;
  }

  interface BackButton {
    isVisible: boolean;
    show: VoidFunction;
    hide: VoidFunction;
    onClick: (_cb: VoidFunction) => void;
    offClick: (_cb: VoidFunction) => void;
  }

  interface MainButton {
    isActive: boolean;
    isVisible: boolean;
    isProgressVisible: boolean;
    text: string;
    color: `#${string}`;
    textColor: `#${string}`;
    show: VoidFunction;
    hide: VoidFunction;
    enable: VoidFunction;
    disable: VoidFunction;
    hideProgress: VoidFunction;
    showProgress: (_leaveActive?: boolean) => void;
    onClick: (_callback: VoidFunction) => void;
    offClick: (_callback: VoidFunction) => void;
    setText: (_text: string) => void;
    setParams: (_params: {
      color?: string;
      text?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
  }

  type InvoiceStatuses = "pending" | "failed" | "cancelled" | "paid";

  type EventNames =
    | "invoiceClosed"
    | "settingsButtonClicked"
    | "backButtonClicked"
    | "mainButtonClicked"
    | "viewportChanged"
    | "themeChanged"
    | "popupClosed"
    | "qrTextReceived"
    | "clipboardTextReceived"
    | "writeAccessRequested"
    | "contactRequested";

  type EventParams = {
    invoiceClosed: { url: string; status: InvoiceStatuses };
    settingsButtonClicked: void;
    backButtonClicked: void;
    mainButtonClicked: void;
    viewportChanged: { isStateStable: boolean };
    themeChanged: void;
    popupClosed: { button_id: string | null };
    qrTextReceived: { data: string };
    clipboardTextReceived: { data: string };
    writeAccessRequested: { status: "allowed" | "cancelled" };
    contactRequested: { status: "sent" | "cancelled" };
  };

  type PopupParams = {
    title?: string;
    message: string;
    buttons?: PopupButton[];
  };

  type PopupButton = {
    id?: string;
  } & (
    | {
        type: "default" | "destructive";
        text: string;
      }
    | {
        type: "ok" | "close" | "cancel";
      }
  );

  type ScanQrPopupParams = {
    text?: string;
  };

  type Platforms =
    | "android"
    | "android_x"
    | "ios"
    | "macos"
    | "tdesktop"
    | "weba"
    | "webk"
    | "unigram"
    | "unknown";

  export interface WebApp {
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    platform: Platforms;
    headerColor: `#${string}`;
    backgroundColor: `#${string}`;
    isClosingConfirmationEnabled: boolean;
    themeParams: ThemeParams;
    initDataUnsafe: WebAppInitData;
    initData: string;
    colorScheme: "light" | "dark";
    onEvent: <T extends EventNames>(_eventName: T, _callback: (_params: EventParams[T]) => unknown) => void;
    offEvent: <T extends EventNames>(_eventName: T, _callback: (_params: EventParams[T]) => unknown) => void;
    sendData: (_data: unknown) => void;
    close: VoidFunction;
    expand: VoidFunction;
    MainButton: MainButton;
    HapticFeedback: HapticFeedback;
    CloudStorage: CloudStorage;
    openLink: (_link: string, _options?: { try_instant_view: boolean }) => void;
    openTelegramLink: (_link: string) => void;
    BackButton: BackButton;
    version: string;
    isVersionAtLeast: (_version: string) => boolean;
    openInvoice: (_url: string, _callback?: (_status: InvoiceStatuses) => unknown) => void;
    setHeaderColor: (_color: "bg_color" | "secondary_bg_color" | `#${string}`) => void;
    setBackgroundColor: (_color: "bg_color" | "secondary_bg_color" | `#${string}`) => void;
    showConfirm: (_message: string, _callback?: (_confirmed: boolean) => void) => void;
    showPopup: (_params: PopupParams, _callback?: (_id?: string) => unknown) => void;
    showAlert: (_message: string, _callback?: () => unknown) => void;
    enableClosingConfirmation: VoidFunction;
    disableClosingConfirmation: VoidFunction;
    showScanQrPopup: (_params: ScanQrPopupParams, _callback?: (_text: string) => void | true) => void;
    closeScanQrPopup: () => void;
    readTextFromClipboard: (_callback?: (_text: string) => unknown) => void;
    ready: VoidFunction;
    switchInlineQuery: (
      _query: string,
      _chooseChatTypes?: Array<"users" | "bots" | "groups" | "channels">
    ) => void;
    requestWriteAccess: (_callback?: (_access: boolean) => unknown) => void;
    requestContact: (_callback?: (_access: boolean) => unknown) => void;
  }

  // export interface Telegram {
  //   WebApp: WebApp;
  // }
}

export {};

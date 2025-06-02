/**
 * メニューアイテム定義インターフェース
 */
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  separator?: boolean;
  customClass?: string;
}

/**
 * ボタン定義インターフェース
 */
export interface ButtonOptions {
  id: string;
  icon: string;
  ariaLabel: string;
  customClass?: string;
  onClick?: () => void;
}

/**
 * ドロップダウンメニュー定義インターフェース
 */
export interface DropdownOptions {
  id: string;
  icon: string;
  ariaLabel: string;
  menuItems: MenuItem[];
  customClass?: string;
}

/**
 * Cosense (Scrapbox) のページメニュー（右側のボタン群）操作のためのユーティリティクラス
 */
export class CosenseMenuManager {
  private static readonly PAGE_MENU_SELECTOR = '.page-menu';

  /**
   * ページメニュー（右側のボタン群）コンテナを取得
   */
  public static getPageMenu(): HTMLElement | null {
    return document.querySelector(this.PAGE_MENU_SELECTOR);
  }

  /**
   * ドロップダウンメニューを追加
   * @param options ドロップダウンの設定オプション
   * @returns 作成されたドロップダウン要素
   */
  public static addDropdown(options: DropdownOptions): HTMLElement | null {
    const pageMenu = this.getPageMenu();
    if (!pageMenu) {
      // eslint-disable-next-line no-console
      console.error('Page menu not found');
      return null;
    }

    // ドロップダウンコンテナを作成
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    if (options.customClass) {
      dropdown.classList.add(options.customClass);
    }

    // ドロップダウンボタンを作成
    const button = document.createElement('button');
    button.id = options.id;
    button.className = 'tool-btn dropdown-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', options.ariaLabel);
    button.setAttribute('data-toggle', 'dropdown');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');

    // アイコンを追加
    const icon = document.createElement('i');
    // FontAwesomeアイコンかkamonアイコンか判定
    if (options.icon.startsWith('fa-')) {
      icon.className = `fas ${options.icon}`;
    } else {
      icon.className = `kamon kamon-${options.icon}`;
    }
    button.appendChild(icon);

    // ドロップダウンメニューを作成
    const menu = document.createElement('ul');
    menu.className = 'dropdown-menu dropdown-menu-right';
    menu.setAttribute('aria-labelledby', options.id);

    // メニュー項目を追加
    options.menuItems.forEach((menuItem) => {
      if (menuItem.separator) {
        // 区切り線の場合
        const separator = document.createElement('li');
        separator.setAttribute('role', 'separator');
        separator.className = 'divider';
        menu.appendChild(separator);
      } else {
        // 通常のメニュー項目
        const item = document.createElement('li');
        item.className = menuItem.customClass || '';

        const link = document.createElement('a');
        link.tabIndex = 0;
        link.setAttribute('role', 'menuitem');
        link.id = menuItem.id;

        // アイコンがある場合は追加
        if (menuItem.icon) {
          const menuIcon = document.createElement('i');
          if (menuItem.icon.startsWith('fa-')) {
            menuIcon.className = `fas ${menuItem.icon}`;
          } else {
            menuIcon.className = `kamon kamon-${menuItem.icon}`;
          }
          link.appendChild(menuIcon);
          link.appendChild(document.createTextNode(' '));
        }

        link.appendChild(document.createTextNode(menuItem.label));
        link.addEventListener('click', menuItem.onClick);

        item.appendChild(link);
        menu.appendChild(item);
      }
    });

    // ドロップダウンを組み立てる
    dropdown.appendChild(button);
    dropdown.appendChild(menu);

    // ランダムジャンプボタンの前に挿入する
    const randomJumpButton = pageMenu.querySelector('.random-jump-button');
    if (randomJumpButton) {
      pageMenu.insertBefore(dropdown, randomJumpButton);
    } else {
      pageMenu.appendChild(dropdown);
    }

    // ドロップダウンの初期化（Bootstrap互換）
    this.initializeDropdown(button, menu);

    return dropdown;
  }

  /**
   * 単独のボタンを追加
   * @param options ボタンの設定オプション
   * @returns 作成されたボタン要素
   */
  public static addButton(options: ButtonOptions): HTMLElement | null {
    const pageMenu = this.getPageMenu();
    if (!pageMenu) {
      // eslint-disable-next-line no-console
      console.error('Page menu not found');
      return null;
    }

    // ボタン要素を作成
    const button = document.createElement('button');
    button.id = options.id;
    button.className = 'tool-btn';
    if (options.customClass) {
      button.classList.add(options.customClass);
    }
    button.type = 'button';
    button.setAttribute('aria-label', options.ariaLabel);

    // アイコンを追加
    const icon = document.createElement('i');
    if (options.icon.startsWith('fa-')) {
      icon.className = `fas ${options.icon}`;
    } else {
      icon.className = `kamon kamon-${options.icon}`;
    }
    button.appendChild(icon);

    // クリックイベントを設定
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }

    // ランダムジャンプボタンの前に挿入する
    const randomJumpButton = pageMenu.querySelector('.random-jump-button');
    if (randomJumpButton) {
      pageMenu.insertBefore(button, randomJumpButton);
    } else {
      pageMenu.appendChild(button);
    }

    return button;
  }

  /**
   * 既存のドロップダウンにメニュー項目を追加
   * @param dropdownId 対象のドロップダウンID
   * @param menuItem 追加するメニュー項目
   * @returns 追加されたメニュー項目要素
   */
  public static addMenuItemToDropdown(dropdownId: string, menuItem: MenuItem): HTMLElement | null {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
      // eslint-disable-next-line no-console
      console.error(`Dropdown with id ${dropdownId} not found`);
      return null;
    }

    const menu = dropdown.parentElement?.querySelector('.dropdown-menu');
    if (!menu) {
      // eslint-disable-next-line no-console
      console.error(`Menu not found in dropdown ${dropdownId}`);
      return null;
    }

    // メニュー項目を作成
    const item = document.createElement('li');
    item.className = menuItem.customClass || '';

    if (menuItem.separator) {
      // 区切り線の場合
      item.setAttribute('role', 'separator');
      item.className = 'divider';
    } else {
      // 通常のメニュー項目
      const link = document.createElement('a');
      link.tabIndex = 0;
      link.setAttribute('role', 'menuitem');
      link.id = menuItem.id;

      // アイコンがある場合は追加
      if (menuItem.icon) {
        const menuIcon = document.createElement('i');
        if (menuItem.icon.startsWith('fa-')) {
          menuIcon.className = `fas ${menuItem.icon}`;
        } else {
          menuIcon.className = `kamon kamon-${menuItem.icon}`;
        }
        link.appendChild(menuIcon);
        link.appendChild(document.createTextNode(' '));
      }

      link.appendChild(document.createTextNode(menuItem.label));
      link.addEventListener('click', menuItem.onClick);

      item.appendChild(link);
    }

    menu.appendChild(item);
    return item;
  }

  /**
   * ドロップダウンを削除
   * @param id 削除するドロップダウンのID
   * @returns 成功したかどうか
   */
  public static removeDropdown(id: string): boolean {
    const dropdown = document.getElementById(id);
    if (!dropdown || !dropdown.parentElement) {
      return false;
    }

    const dropdownContainer = dropdown.parentElement;
    if (dropdownContainer.classList.contains('dropdown')) {
      dropdownContainer.remove();
      return true;
    }
    return false;
  }

  /**
   * ボタンを削除
   * @param id 削除するボタンのID
   * @returns 成功したかどうか
   */
  public static removeButton(id: string): boolean {
    const button = document.getElementById(id);
    if (!button) {
      return false;
    }

    button.remove();
    return true;
  }

  /**
   * Bootstrap互換のドロップダウン機能を実装
   * @param button ドロップダウンボタン要素
   * @param menu ドロップダウンメニュー要素
   */
  private static initializeDropdown(button: HTMLElement, menu: HTMLElement): void {
    // クリックイベントでドロップダウン表示を切り替え
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const expanded = button.getAttribute('aria-expanded') === 'true';
      
      // すべてのドロップダウンを閉じる
      document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach((el) => {
        el.setAttribute('aria-expanded', 'false');
        const dropdownMenu = el.parentElement?.querySelector('.dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.remove('show');
        }
      });
      
      // このドロップダウンを開く/閉じる
      button.setAttribute('aria-expanded', (!expanded).toString());
      if (!expanded) {
        menu.classList.add('show');
      } else {
        menu.classList.remove('show');
      }
    });
    
    // ドキュメントのクリックでドロップダウンを閉じる
    document.addEventListener('click', (e) => {
      if (!button.contains(e.target as Node) && !menu.contains(e.target as Node)) {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('show');
      }
    });
  }
}

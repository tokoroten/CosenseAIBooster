import React from 'react';
import ReactDOM from 'react-dom';

/**
 * React component for the menu manager
 */
interface MenuManagerProps {
  children: React.ReactNode;
}

/**
 * Menu button interface
 */
export interface CosenseMenuButton {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  customClass?: string;
}

/**
 * Dropdown menu interface
 */
export interface CosenseDropdownMenu {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  menuItems: CosenseMenuItem[];
  customClass?: string;
}

/**
 * Menu item interface
 */
export interface CosenseMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  separator?: boolean;
  customClass?: string;
}

/**
 * CosenseMenuManager using React
 * This is a React component that manages Cosense menu items
 */
export class ReactCosenseMenuManager extends React.Component<MenuManagerProps> {
  private static instance: ReactCosenseMenuManager | null = null;
  private buttons: CosenseMenuButton[] = [];
  private dropdowns: CosenseDropdownMenu[] = [];
  private container: HTMLElement | null = null;

  constructor(props: MenuManagerProps) {
    super(props);

    if (ReactCosenseMenuManager.instance) {
      throw new Error('ReactCosenseMenuManager is already instantiated');
    }

    ReactCosenseMenuManager.instance = this;
  }

  static getInstance(): ReactCosenseMenuManager {
    if (!ReactCosenseMenuManager.instance) {
      throw new Error('ReactCosenseMenuManager is not instantiated yet');
    }
    return ReactCosenseMenuManager.instance;
  }

  componentDidMount() {
    this.container = document.querySelector('.tools');
    if (!this.container) {
      console.error('Could not find .tools container');
      return;
    }

    // Create a container for our React menu items
    const menuContainer = document.createElement('div');
    menuContainer.id = 'cosense-ai-menu-container';
    menuContainer.className = 'cosense-ai-menu-container';
    this.container.appendChild(menuContainer);

    // Render our React component into the container
    ReactDOM.render(this.props.children, menuContainer);
  }

  componentWillUnmount() {
    if (this.container) {
      const menuContainer = document.getElementById('cosense-ai-menu-container');
      if (menuContainer) {
        ReactDOM.unmountComponentAtNode(menuContainer);
        menuContainer.remove();
      }
    }
    ReactCosenseMenuManager.instance = null;
  }

  addButton(button: CosenseMenuButton): void {
    this.buttons.push(button);
    this.forceUpdate();
  }

  removeButton(id: string): void {
    this.buttons = this.buttons.filter((button) => button.id !== id);
    this.forceUpdate();
  }

  addDropdown(dropdown: CosenseDropdownMenu): void {
    this.dropdowns.push(dropdown);
    this.forceUpdate();
  }

  removeDropdown(id: string): void {
    this.dropdowns = this.dropdowns.filter((dropdown) => dropdown.id !== id);
    this.forceUpdate();
  }

  addMenuItemToDropdown(dropdownId: string, menuItem: CosenseMenuItem): void {
    const dropdown = this.dropdowns.find((d) => d.id === dropdownId);
    if (dropdown) {
      dropdown.menuItems.push(menuItem);
      this.forceUpdate();
    }
  }

  removeMenuItemFromDropdown(dropdownId: string, menuItemId: string): void {
    const dropdown = this.dropdowns.find((d) => d.id === dropdownId);
    if (dropdown) {
      dropdown.menuItems = dropdown.menuItems.filter((item) => item.id !== menuItemId);
      this.forceUpdate();
    }
  }

  render() {
    return (
      <div className="cosense-ai-menu-items">
        {/* Render buttons */}
        {this.buttons.map((button) => (
          <button
            key={button.id}
            id={button.id}
            className={`tool-btn ${button.customClass || ''}`}
            aria-label={button.ariaLabel}
            onClick={button.onClick}
          >
            {button.icon}
          </button>
        ))}

        {/* Render dropdowns */}
        {this.dropdowns.map((dropdown) => (
          <div key={dropdown.id} className={`dropdown ${dropdown.customClass || ''}`}>
            <button
              id={dropdown.id}
              className="tool-btn dropdown-toggle"
              type="button"
              aria-label={dropdown.ariaLabel}
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {dropdown.icon}
            </button>
            <ul className="dropdown-menu dropdown-menu-right" aria-labelledby={dropdown.id}>
              {dropdown.menuItems.map((item) => {
                if (item.separator) {
                  return <li key={item.id} role="separator" className="divider"></li>;
                }
                return (
                  <li key={item.id}>
                    <a
                      href="#"
                      className={`dropdown-item ${item.customClass || ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        item.onClick();
                      }}
                    >
                      {item.icon && <span className="menu-icon">{item.icon}</span>}
                      <span className="menu-label">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Original children */}
        {this.props.children}
      </div>
    );
  }
}

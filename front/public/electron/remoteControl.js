const { mouse, keyboard, Point, Button, Key, straightTo } = require('@nut-tree-fork/nut-js');
const { dialog } = require('electron');
// Configure mouse and keyboard
// mouse.config.autoDelayMs = 50;
// keyboard.config.autoDelayMs = 100;
let isDragging = false;

const handleControlEvent = async ({ type, payload }) => {
  try {
    console.log("6. RemoteControl: Processing control event:", type, payload);

    switch (type) {
      case "mousemove":
        await mouse.move(straightTo(new Point(payload.x, payload.y)));
        break;

      case "click":
        await mouse.click(Button.LEFT);
        break;

      case "rightClick":
        await mouse.click(Button.RIGHT);
        break;

      case "doubleClick":
        await mouse.click(Button.LEFT);
        await mouse.click(Button.LEFT);
        break;
      case "pressButton":
        // payload.button can be 'left', 'right', or 'middle'
        await mouse.pressButton(Button.LEFT)
        break;
      case "releaseButton":
        await mouse.releaseButton(Button.LEFT);
        break;
        case "drag":
        await mouse.drag(straightTo(new Point(payload.x, payload.y)));
        break;
      case "keydown":
        try {
          const keyMap = {
            Backspace: Key.Backspace,
            Tab: Key.Tab,
            Enter: Key.Enter,
            Shift: Key.LeftShift,
            Control: Key.LeftControl,
            Alt: Key.LeftAlt,
            CapsLock: Key.CapsLock,
            Escape: Key.Escape,
            Space: Key.Space,
            PageUp: Key.PageUp,
            PageDown: Key.PageDown,
            End: Key.End,
            Home: Key.Home,
            ArrowLeft: Key.Left,
            ArrowUp: Key.Up,
            ArrowRight: Key.Right,
            ArrowDown: Key.Down,
            Insert: Key.Insert,
            Delete: Key.Delete,
            Meta: Key.LeftSuper,
            ContextMenu: Key.Menu,
            PrintScreen: Key.Print,
            Pause: Key.Pause,
            NumLock: Key.NumLock,
            ScrollLock: Key.ScrollLock,

            // Function Keys
            F1: Key.F1,
            F2: Key.F2,
            F3: Key.F3,
            F4: Key.F4,
            F5: Key.F5,
            F6: Key.F6,
            F7: Key.F7,
            F8: Key.F8,
            F9: Key.F9,
            F10: Key.F10,
            F11: Key.F11,
            F12: Key.F12,

            // Punctuation
            ";": Key.Semicolon,
            "=": Key.Equal,
            ",": Key.Comma,
            "-": Key.Minus,
            ".": Key.Period,
            "/": Key.Slash,
            "`": Key.Grave,
            "[": Key.LeftBracket,
            "\\": Key.Backslash,
            "]": Key.RightBracket,
            "'": Key.Quote,

            // Number row
            0: Key.Num0,
            1: Key.Num1,
            2: Key.Num2,
            3: Key.Num3,
            4: Key.Num4,
            5: Key.Num5,
            6: Key.Num6,
            7: Key.Num7,
            8: Key.Num8,
            9: Key.Num9,

            // Numpad
            Numpad0: Key.NumPad0,
            Numpad1: Key.NumPad1,
            Numpad2: Key.NumPad2,
            Numpad3: Key.NumPad3,
            Numpad4: Key.NumPad4,
            Numpad5: Key.NumPad5,
            Numpad6: Key.NumPad6,
            Numpad7: Key.NumPad7,
            Numpad8: Key.NumPad8,
            Numpad9: Key.NumPad9,
            NumpadAdd: Key.Add,
            NumpadSubtract: Key.Subtract,
            NumpadMultiply: Key.Multiply,
            NumpadDivide: Key.Divide,
            NumpadDecimal: Key.Decimal,
            NumpadEnter: Key.NumPadEnter,
          };

          const shiftKeyMap = {
            "!": { key: Key.Num1 },
            "@": { key: Key.Num2 },
            "#": { key: Key.Num3 },
            '$': { key: Key.Num4 },
            "%": { key: Key.Num5 },
            "^": { key: Key.Num6 },
            "&": { key: Key.Num7 },
            "*": { key: Key.Num8 },
            "(": { key: Key.Num9 },
            ")": { key: Key.Num0 },
            '_': { key: Key.Minus },
            "+": { key: Key.Equal },
            "~": { key: Key.Grave },
            "{": { key: Key.LeftBracket },
            "}": { key: Key.RightBracket },
            "|": { key: Key.Backslash },
            ":": { key: Key.Semicolon },
            '"': { key: Key.Quote },
            "<": { key: Key.Comma },
            ">": { key: Key.Period },
            "?": { key: Key.Slash },
          };
          // Simulated payload from UI or event
          async function handleKeyPress(payload) {
            try {
              let key = null;
              const inputKey = payload.key;

              if (shiftKeyMap[inputKey]) {
                // Shift + symbol
                key = shiftKeyMap[inputKey].key;
              } else if (keyMap[inputKey]) {
                key = keyMap[inputKey];
              } else if (/^[a-zA-Z]$/.test(inputKey)) {
                // A-Z characters
                const upperKey = Key[inputKey.toUpperCase()];
                key = upperKey;
              // } 
              // else if (payload.ctrlKey) {
              //   // Ctrl + key
              //   switch (inputKey) {
              //     case "a":
              //       key = Key.A;
              //       break;
              //     case "c":
              //       key = Key.C;
              //       break;
              //     case "v":
              //       key = Key.V;
              //       break;
              //     case "x":
              //       key = Key.X;
              //       break;
              //     case "z":
              //       key = Key.Z;
              //       break;
              //     case "s":
              //       key = Key.S;
              //       break;
              //     case "n":
              //       key = Key.N;
              //       break;
              //     case "p":
              //       key = Key.P;
              //       break;
              //     case "b":
              //       key = Key.Backspace;
              //       break;
              //     default:
              //       console.warn(
              //         `Unsupported Ctrl + key combination: "${inputKey}"`
              //       );
              //   }
              } else {
                console.warn(`Unknown or unsupported key: "${inputKey}"`);
              }

              if (key) {
                await keyboard.pressKey(key);
                await keyboard.releaseKey(key);
              }
            } catch (error) {
              console.error("Keyboard action failed:", error);
            }
          }
          // === THIS LINE WAS MISSING ===
          await handleKeyPress(payload);
        } catch (error) {
          console.error("", error);
        }
        break;

      case "scroll":
        if (payload.amount > 0) {
          console.log(payload.amount, "scroll----------------");

          await mouse.scrollDown(payload.amount);
        } else {
          await mouse.scrollUp(Math.abs(payload.amount));
        }
        break;
    }
  } catch (error) {
    // console.error('8. RemoteControl: Error executing control:', error);
    console.error('Remote control error:', error);
  }
};

module.exports = { handleControlEvent };
const { mouse, keyboard, Point, Button, Key, straightTo } = require('@nut-tree-fork/nut-js');
const { dialog } = require('electron');
// Configure mouse and keyboard
mouse.config.autoDelayMs = 100;
keyboard.config.autoDelayMs = 100;

const handleControlEvent = async ({ type, payload }) => {
  try {
    console.log("6. RemoteControl: Processing control event:", type, payload);
    dialog.showMessageBox({
      type: 'info',
      message: `6. RemoteControl: Processing control event: ${type}`
    });
    switch (type) {
      case 'mousemove':
        // console.log("7. RemoteControl: Executing mouse move to", payload.x, payload.y);
        // dialog.showMessageBox({
        //   type: 'info',
        //   message: `7. RemoteControl: Executing mouse move to ${payload.x}, ${payload.y}`
        // });
        
        try {
            await mouse.move(straightTo(new Point(payload.x, payload.y)));
            console.log("8. RemoteControl: Mouse move completed successfully");
            dialog.showMessageBox({
              type: 'info',
              message: "8. RemoteControl: Mouse move completed successfully"
            });
          } catch (moveError) {
            console.error("8. RemoteControl: Mouse move failed:", moveError);
            dialog.showMessageBox({
              type: 'error',
              message: `8. RemoteControl: Mouse move failed: ${moveError.message}`
            });
            throw moveError;
          }
          break;

      case 'click':
        await mouse.click(Button.LEFT);
        break;

      case 'rightClick':
        await mouse.click(Button.RIGHT);
        break;

      case 'doubleClick':
        await mouse.click(Button.LEFT);
        await mouse.click(Button.LEFT);
        break;

      case 'keydown':
        const key = Key[payload.key.toUpperCase()];
        if (key) {
          await keyboard.pressKey(key);
          await keyboard.releaseKey(key);
        }
        break;

      case 'scroll':
        if (payload.amount > 0) {
          await mouse.scrollDown(payload.amount);
        } else {
          await mouse.scrollUp(Math.abs(payload.amount));
        }
        break;
    }
  } catch (error) {
    console.error('8. RemoteControl: Error executing control:', error);
    console.error('Remote control error:', error);
  }
};

module.exports = { handleControlEvent };
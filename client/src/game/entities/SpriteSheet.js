// src/game/entities/SpriteSheet.js
// Generic helper for drawing a frame out of a grid-based sprite sheet
// (row = animation, column = frame within that animation).
//
// Usage:
//   const sheet = new SpriteSheet('/sprites/player.png', 313, 313, 4, 4);
//   sheet.draw(ctx, row, col, x, y, w, h, flip);
//
// `flip` mirrors the frame horizontally around its own destination box —
// use this instead of regenerating art when you need the same sheet to
// face the opposite direction (e.g. player faces right by default; if you
// ever need it facing left, pass flip: true rather than making a new sheet).

export class SpriteSheet {
  constructor(src, frameWidth, frameHeight, columns, rows) {
    this.image = new Image();
    this.image.src = src;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = columns;
    this.rows = rows;
    this.loaded = false;
    this.image.onload = () => {
      this.loaded = true;
    };
  }

  // Returns true if it actually drew a sprite frame; false if the image
  // isn't loaded yet (caller should fall back to a placeholder rect so
  // there's never a blank gap while the sheet is loading).
  draw(ctx, row, col, destX, destY, destWidth, destHeight, flip = false) {
    if (!this.loaded) return false;

    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;
    

    if (flip) {
      ctx.save();
      ctx.translate(destX + destWidth, destY);
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        sx, sy, this.frameWidth, this.frameHeight,
        0, 0, destWidth, destHeight
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        this.image,
        sx, sy, this.frameWidth, this.frameHeight,
        destX, destY, destWidth, destHeight
      );
    }
    return true;
  }

  // Draws a circular HUD "portrait" — a zoomed-in crop from one frame,
  // clipped to a circle. Defaults sample the center-top ~55% of the frame
  // (where a standing character's head/face usually sits) so it reads as
  // a face icon rather than a full-body shrink. Tune cropRatio/cropTopRatio
  // per sheet if the face isn't centered the way you expect.
  //
  // Returns true if it drew something; false if the image isn't loaded yet
  // (caller should fall back to a placeholder circle).
  drawPortrait(ctx, row, col, centerX, centerY, radius, cropRatio = 0.55, cropTopRatio = 0.06) {
    if (!this.loaded) return false;

    const cropWidth = this.frameWidth * cropRatio;
    const cropHeight = this.frameHeight * cropRatio;
    const sx = col * this.frameWidth + (this.frameWidth - cropWidth) / 2;
    const sy = row * this.frameHeight + this.frameHeight * cropTopRatio;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      this.image,
      sx, sy, cropWidth, cropHeight,
      centerX - radius, centerY - radius, radius * 2, radius * 2
    );

    ctx.restore();
    return true;
  }
}
import { MMCQ } from "./quantize.js";

export class MonksColorPalette {
    static rgbToHex(r, g, b) {
        var componentToHex = function (c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    static createPixelArray(imgData, pixelCount, quality) {
        const pixels = imgData;
        const pixelArray = [];

        for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];

            // If pixel is mostly opaque and not white
            if (typeof a === 'undefined' || a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }
        return pixelArray;
    }

    static getPalette(url) {
        // Create custom CanvasImage object
        MonksColorPalette.canvasImage = new Image();
        MonksColorPalette.canvasImage.addEventListener('load', () => {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let width = canvas.width = MonksColorPalette.canvasImage.naturalWidth;
            let height = canvas.height = MonksColorPalette.canvasImage.naturalHeight;
            context.drawImage(MonksColorPalette.canvasImage, 0, 0, width, height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelCount = MonksColorPalette.canvasImage.width * MonksColorPalette.canvasImage.height;

            const pixelArray = MonksColorPalette.createPixelArray(imageData.data, pixelCount, 10);

            canvas.remove();

            // Send array to quantize function which clusters values
            // using median cut algorithm
            const cmap = MMCQ.quantize(pixelArray, 5);
            const palette = cmap ? cmap.palette() : null;

            let element = $('.palette-fields');

            $(element).empty();
            for (let i = 0; i < palette.length; i++) {
                var hexCode = MonksColorPalette.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
                $(element).append($('<div>').addClass('background-palette').attr('title', hexCode).css({ backgroundColor: hexCode }).on('click', $.proxy(MonksColorPalette.updateSceneBackground, MonksColorPalette, hexCode)));
            }

            //const dominantColor = palette[0];
        });
        MonksColorPalette.canvasImage.src = url;
    };

    static async updateSceneBackground(hexCode) {
        await MonksColorPalette.currentScene.update({ backgroundColor: hexCode });
    }
}

Hooks.on('renderSceneConfig', async (app, html, options) => {
    MonksColorPalette.currentScene = app.object;

    if (MonksColorPalette.currentScene.img != undefined) {
        let backgroundColor = $('input[name="backgroundColor"]').parents('.form-group:first');

        $('<div>')
            .addClass('form-group')
            .append($('<label>').html('Background Palette'))
            .append($('<div>').addClass('form-fields palette-fields'))
            .insertAfter(backgroundColor);

        MonksColorPalette.getPalette(MonksColorPalette.currentScene.img);
    }

    $('input.image[name="img"]').on('change', function () {
        let img = $(this).val();
        MonksColorPalette.getPalette(img);
    })
});

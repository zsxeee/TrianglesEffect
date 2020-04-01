const Triangles = (function () {
    function randomNum(minNum: number, maxNum: number): number {
        return parseInt((Math.random() * (maxNum - minNum + 1) + minNum).toString(), 10);
    }

    function convertColor(color: string): HSLColor {
        let div = document.createElement('div');
        div.style.backgroundColor = color;
        document.body.appendChild(div);
        let rgb = window.getComputedStyle(div).backgroundColor;
        document.body.removeChild(div);
        let rgbMatcher = rgb.match(/^rgb[a]?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+(\.\d+)?\s*)?\)$/m);

        let r = parseInt(rgbMatcher[1]) / 255, g = parseInt(rgbMatcher[2]) / 255, b = parseInt(rgbMatcher[3]) / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }

        return new HSLColor(Math.round(h), s, l);
    }

    /** @internal */
    class Triangle {
        color: string;
        width: number;
        height: number;
        x: number;
        y: number;

        constructor(color: string, width: number, height: number, x: number, y: number) {
            this.color = color;
            this.width = width;
            this.height = height;
            this.x = x;
            this.y = y;
        }
    }

    /** @internal */
    class HSLColor {
        h: number;
        s: number;
        l: number;

        constructor(h: number, s: number, l: number) {
            this.h = h;
            this.s = s;
            this.l = l;
        }
    }

    return class Triangles {
        private context: CanvasRenderingContext2D;
        private baseColor: { h: number, s: number, l: number };
        private readonly density: number;
        private readonly triangleList: Array<Triangle>;

        /**
         * @param {HTMLCanvasElement} canvas - The canvas that need draw.
         * @param {string} baseColor - Drawing will depend this color.
         * @param {number?} density - Triangle's density, default is 150.
         */
        constructor(canvas: HTMLCanvasElement, baseColor: string, density: number = 150) {
            //init variable
            this.context = canvas.getContext("2d");
            this.changeColor(baseColor);
            this.density = density;

            //prepare canvas
            this.triangleList = new Array(this.density);
            this.init(canvas);

            //resize
            window.addEventListener("resize", () => this.init(canvas));

            this.drawFrame();
        }

        public changeColor(nv: string) {
            this.baseColor = convertColor(nv);
            this.init(this.context.canvas);
        }

        private init(canvas: HTMLCanvasElement): void {
            this.context.canvas.width = canvas.width;
            this.context.canvas.height = canvas.height;
            this.context.fillStyle = `hsl(${this.baseColor["h"]}, ${this.baseColor["s"] * 100}%, ${this.baseColor["l"] * 100}%)`;
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
            //prepare triangle
            for (let i = 0; i < this.density; i++) {
                this.triangleList[i] = this.createTriangle();
            }
        }

        private clearFrame(): void {
            this.context.fillStyle = `hsl(${this.baseColor["h"]}, ${this.baseColor["s"] * 100}%, ${this.baseColor["l"] * 100}%)`;
            this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        }

        private drawFrame(): void {
            this.clearFrame();
            this.triangleList.forEach((el) => {
                this.drawTriangle(el);
            });
            this.updateTriangles();

            requestAnimationFrame(() => {
                this.drawFrame();
            });
        }

        private drawTriangle(triangle) {
            this.context.fillStyle = triangle.color;
            this.context.beginPath();
            this.context.moveTo(triangle.x + (triangle.width / 2), triangle.y);
            this.context.lineTo(triangle.x, triangle.y + triangle.height);
            this.context.lineTo(triangle.x + triangle.width, triangle.y + triangle.height);
            this.context.lineTo(triangle.x + (triangle.width / 2), triangle.y);
            this.context.fill();
        }

        private updateTriangles() {
            this.triangleList.forEach((el, index) => {
                if (el.y < 0 - el.height) {
                    this.triangleList.splice(index, 1);
                    this.triangleList.push(this.createTriangle(true))
                }

                el.y -= el.height * .001;
            });
        }

        private createTriangle(isFromStart: boolean = false) {
            let tWidth = randomNum(this.context.canvas.width * .03, this.context.canvas.width * .25);
            let tHeight = (Math.sqrt(3) / 2) * tWidth;
            return new Triangle(
                this.getRandomColor(),
                tWidth,
                tHeight,
                randomNum(0 - (tWidth * .5), this.context.canvas.width + (tWidth * .5)),
                isFromStart ? this.context.canvas.height : randomNum(0 - tHeight, this.context.canvas.height + tHeight)
            );
        }

        private getRandomColor(): string {
            const wave = .05;
            let minLight = this.baseColor["l"] - wave;
            if (minLight < 0) minLight = 0;
            let maxLight = this.baseColor["l"] + wave;
            if (maxLight > 1) maxLight = 1;

            let randomLight = randomNum(minLight * 100, maxLight * 100) / 100;

            return `hsl(${this.baseColor["h"]}, ${this.baseColor["s"] * 100}%, ${randomLight * 100}%)`;
        }
    };
})();

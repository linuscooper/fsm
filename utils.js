// draw using this instead of a canvas and call toLaTeX() afterward
function ExportAsLaTeX() {
  this._points = [];
  this._texData = "";
  this._scale = 0.1; // to convert pixels to document space (TikZ breaks if the numbers get too big, above 500?)

  this.toLaTeX = function () {
    return (
      "\\documentclass[12pt]{article}\n" +
      "\\usepackage{tikz}\n" +
      "\n" +
      "\\begin{document}\n" +
      "\n" +
      "\\begin{center}\n" +
      "\\begin{tikzpicture}[scale=0.2]\n" +
      "\\tikzstyle{every node}+=[inner sep=0pt]\n" +
      this._texData +
      "\\end{tikzpicture}\n" +
      "\\end{center}\n" +
      "\n" +
      "\\end{document}\n"
    );
  };

  this.beginPath = function () {
    this._points = [];
  };
  this.arc = function (x, y, radius, startAngle, endAngle, isReversed) {
    x *= this._scale;
    y *= this._scale;
    radius *= this._scale;
    if (endAngle - startAngle == Math.PI * 2) {
      this._texData +=
        "\\draw [" +
        this.strokeStyle +
        "] (" +
        fixed(x, 3) +
        "," +
        fixed(-y, 3) +
        ") circle (" +
        fixed(radius, 3) +
        ");\n";
    } else {
      if (isReversed) {
        var temp = startAngle;
        startAngle = endAngle;
        endAngle = temp;
      }
      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      // TikZ needs the angles to be in between -2pi and 2pi or it breaks
      if (Math.min(startAngle, endAngle) < -2 * Math.PI) {
        startAngle += 2 * Math.PI;
        endAngle += 2 * Math.PI;
      } else if (Math.max(startAngle, endAngle) > 2 * Math.PI) {
        startAngle -= 2 * Math.PI;
        endAngle -= 2 * Math.PI;
      }
      startAngle = -startAngle;
      endAngle = -endAngle;
      this._texData +=
        "\\draw [" +
        this.strokeStyle +
        "] (" +
        fixed(x + radius * Math.cos(startAngle), 3) +
        "," +
        fixed(-y + radius * Math.sin(startAngle), 3) +
        ") arc (" +
        fixed((startAngle * 180) / Math.PI, 5) +
        ":" +
        fixed((endAngle * 180) / Math.PI, 5) +
        ":" +
        fixed(radius, 3) +
        ");\n";
    }
  };
  this.moveTo = this.lineTo = function (x, y) {
    x *= this._scale;
    y *= this._scale;
    this._points.push({ x: x, y: y });
  };
  this.stroke = function () {
    if (this._points.length == 0) return;
    this._texData += "\\draw [" + this.strokeStyle + "]";
    for (var i = 0; i < this._points.length; i++) {
      var p = this._points[i];
      this._texData +=
        (i > 0 ? " --" : "") +
        " (" +
        fixed(p.x, 2) +
        "," +
        fixed(-p.y, 2) +
        ")";
    }
    this._texData += ";\n";
  };
  this.fill = function () {
    if (this._points.length == 0) return;
    this._texData += "\\fill [" + this.strokeStyle + "]";
    for (var i = 0; i < this._points.length; i++) {
      var p = this._points[i];
      this._texData +=
        (i > 0 ? " --" : "") +
        " (" +
        fixed(p.x, 2) +
        "," +
        fixed(-p.y, 2) +
        ")";
    }
    this._texData += ";\n";
  };
  this.measureText = function (text) {
    var c = canvas.getContext("2d");
    c.font = '20px "Times New Romain", serif';
    return c.measureText(text);
  };
  this.advancedFillText = function (text, originalText, x, y, angleOrNull) {
    if (text.replace(" ", "").length > 0) {
      var nodeParams = "";
      // x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
      if (angleOrNull != null) {
        var width = this.measureText(text).width;
        var dx = Math.cos(angleOrNull);
        var dy = Math.sin(angleOrNull);
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) (nodeParams = "[right] "), (x -= width / 2);
          else (nodeParams = "[left] "), (x += width / 2);
        } else {
          if (dy > 0) (nodeParams = "[below] "), (y -= 10);
          else (nodeParams = "[above] "), (y += 10);
        }
      }
      x *= this._scale;
      y *= this._scale;
      this._texData +=
        "\\draw (" +
        fixed(x, 2) +
        "," +
        fixed(-y, 2) +
        ") node " +
        nodeParams +
        "{$" +
        originalText.replace(/ /g, "\\mbox{ }") +
        "$};\n";
    }
  };

  this.translate = this.save = this.restore = this.clearRect = function () {};
}

// draw using this instead of a canvas and call toSVG() afterward
function ExportAsSVG() {
  this.fillStyle = "black";
  this.strokeStyle = "black";
  this.lineWidth = 1;
  this.font = "12px Arial, sans-serif";
  this._points = [];
  this._svgData = "";
  this._transX = 0;
  this._transY = 0;

  this.toSVG = function () {
    return (
      '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
      this._svgData +
      "</svg>\n"
    );
  };

  this.beginPath = function () {
    this._points = [];
  };
  this.arc = function (x, y, radius, startAngle, endAngle, isReversed) {
    x += this._transX;
    y += this._transY;
    var style =
      'stroke="' +
      this.strokeStyle +
      '" stroke-width="' +
      this.lineWidth +
      '" fill="none"';

    if (endAngle - startAngle == Math.PI * 2) {
      this._svgData +=
        "\t<ellipse " +
        style +
        ' cx="' +
        fixed(x, 3) +
        '" cy="' +
        fixed(y, 3) +
        '" rx="' +
        fixed(radius, 3) +
        '" ry="' +
        fixed(radius, 3) +
        '"/>\n';
    } else {
      if (isReversed) {
        var temp = startAngle;
        startAngle = endAngle;
        endAngle = temp;
      }

      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }

      var startX = x + radius * Math.cos(startAngle);
      var startY = y + radius * Math.sin(startAngle);
      var endX = x + radius * Math.cos(endAngle);
      var endY = y + radius * Math.sin(endAngle);
      var useGreaterThan180 = Math.abs(endAngle - startAngle) > Math.PI;
      var goInPositiveDirection = 1;

      this._svgData += "\t<path " + style + ' d="';
      this._svgData += "M " + fixed(startX, 3) + "," + fixed(startY, 3) + " "; // startPoint(startX, startY)
      this._svgData += "A " + fixed(radius, 3) + "," + fixed(radius, 3) + " "; // radii(radius, radius)
      this._svgData += "0 "; // value of 0 means perfect circle, others mean ellipse
      this._svgData += +useGreaterThan180 + " ";
      this._svgData += +goInPositiveDirection + " ";
      this._svgData += fixed(endX, 3) + "," + fixed(endY, 3); // endPoint(endX, endY)
      this._svgData += '"/>\n';
    }
  };
  this.moveTo = this.lineTo = function (x, y) {
    x += this._transX;
    y += this._transY;
    this._points.push({ x: x, y: y });
  };
  this.stroke = function () {
    if (this._points.length == 0) return;
    this._svgData +=
      '\t<polygon stroke="' +
      this.strokeStyle +
      '" stroke-width="' +
      this.lineWidth +
      '" points="';
    for (var i = 0; i < this._points.length; i++) {
      this._svgData +=
        (i > 0 ? " " : "") +
        fixed(this._points[i].x, 3) +
        "," +
        fixed(this._points[i].y, 3);
    }
    this._svgData += '"/>\n';
  };
  this.fill = function () {
    if (this._points.length == 0) return;
    this._svgData +=
      '\t<polygon fill="' +
      this.fillStyle +
      '" stroke-width="' +
      this.lineWidth +
      '" points="';
    for (var i = 0; i < this._points.length; i++) {
      this._svgData +=
        (i > 0 ? " " : "") +
        fixed(this._points[i].x, 3) +
        "," +
        fixed(this._points[i].y, 3);
    }
    this._svgData += '"/>\n';
  };
  this.measureText = function (text) {
    var c = canvas.getContext("2d");
    c.font = '20px "Times New Romain", serif';
    return c.measureText(text);
  };
  this.fillText = function (text, x, y) {
    x += this._transX;
    y += this._transY;
    if (text.replace(" ", "").length > 0) {
      this._svgData +=
        '\t<text x="' +
        fixed(x, 3) +
        '" y="' +
        fixed(y, 3) +
        '" font-family="Times New Roman" font-size="20">' +
        textToXML(text) +
        "</text>\n";
    }
  };
  this.translate = function (x, y) {
    this._transX = x;
    this._transY = y;
  };

  this.save = this.restore = this.clearRect = function () {};
}

// Used by convertLatexShortcuts()
var greekLetterNames = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Eta",
  "Theta",
  "Iota",
  "Kappa",
  "Lambda",
  "Mu",
  "Nu",
  "Xi",
  "Omicron",
  "Pi",
  "Rho",
  "Sigma",
  "Tau",
  "Upsilon",
  "Phi",
  "Chi",
  "Psi",
  "Omega",
];

function convertLatexShortcuts(text) {
  // html greek characters
  for (var i = 0; i < greekLetterNames.length; i++) {
    var name = greekLetterNames[i];
    text = text.replace(
      new RegExp("\\\\" + name, "g"),
      String.fromCharCode(913 + i + (i > 16))
    );
    text = text.replace(
      new RegExp("\\\\" + name.toLowerCase(), "g"),
      String.fromCharCode(945 + i + (i > 16))
    );
  }

  // subscripts
  for (var i = 0; i < 10; i++) {
    text = text.replace(
      new RegExp("_" + i, "g"),
      String.fromCharCode(8320 + i)
    );
  }

  return text;
}

// Used by ExportAsSVG()
function textToXML(text) {
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  var result = "";
  for (var i = 0; i < text.length; i++) {
    var c = text.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) {
      result += text[i];
    } else {
      result += "&#" + c + ";";
    }
  }
  return result;
}

// Used by elements
function drawArrow(c, x, y, angle) {
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
}

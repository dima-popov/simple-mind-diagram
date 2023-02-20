const mainWrapObj = {
  clearSelected: "",
  selectedRect: undefined,
  selectedLine: undefined,
  selectedCrossLine: undefined,
  selectedNote: undefined,
  note_id: 0,
  rect_id: 0,
  line_id: 0,
  canvas_states: [],
  current_state: 0,
  canvasZoom: 1,
};

mainWrapObj.selectObj = function selectObj(number, obj) {
  this.selectedRect = undefined;
  this.selectedLine = undefined;
  this.selectedCrossLine = undefined;
  this.selectedNote = undefined;

  if (number == 1) {
    this.selectedRect = obj;
  } else if (number == 2) {
    this.selectedLine = obj;
  } else if (number == 3) {
    this.selectedCrossLine = obj;
  } else if (number == 4) {
    this.selectedNote = obj;
  }
};

mainWrapObj.addBlock = function addBlock(e) {
  var curr_level;
  clearTimeout(mainWrapObj.clearSelected);

  mainWrapObj.rect_id++;
  mainWrapObj.line_id++;

  var parent_id;
  var line_id_red = mainWrapObj.line_id;
  if (mainWrapObj.selectedRect == undefined) {
    curr_level = 0;
    line_id_red = "";

    formBlock();
  } else {
    curr_level = Number(d3.select(mainWrapObj.selectedRect).attr("level")) + 1;

    parent_id = d3.select(mainWrapObj.selectedRect).attr("block_id");

    const params = formBlock();

    const wireoutarr = d3
      .select(mainWrapObj.selectedRect)
      .attr("wireoutarr")
      .split(",");
    wireoutarr.push(mainWrapObj.line_id);
    const wireoutstring = wireoutarr.join(",");

    d3.select(mainWrapObj.selectedRect).attr("wireoutarr", wireoutstring);

    const from_x = parseFloat(d3.select(mainWrapObj.selectedRect).attr("x"));
    const from_y = parseFloat(d3.select(mainWrapObj.selectedRect).attr("y"));

    mainWrapObj.drawWire(
      [from_x, from_y],
      [params.cx, params.cy],
      mainWrapObj.line_id,
      d3.select(mainWrapObj.selectedRect).attr("block_id"),
      mainWrapObj.rect_id,
      mainWrapObj.selectedRect,
      curr_level
    );
  }

  function formBlock() {
    const wrap_pos = $(".workspace")[0].getBoundingClientRect();

    const correct_x =
      e.x / mainWrapObj.canvasZoom - wrap_pos.x / mainWrapObj.canvasZoom;
    const correct_y =
      e.y / mainWrapObj.canvasZoom - wrap_pos.y / mainWrapObj.canvasZoom;

    svg
      .append("svg")
      .attr("class", "rect_wrap")
      .attr("theme", mainWrapObj.theme)
      .attr("wireoutarr", "")
      .attr("width", "80px")
      .attr("height", "86px")
      .attr("x", correct_x - 26)
      .attr("y", correct_y - 45)
      .attr("block_id", mainWrapObj.rect_id)
      .attr("level", curr_level)
      .attr("line_in", line_id_red)
      .attr("parent", parent_id)
      .append("svg")
      .attr("class", "sub_rect_wrap")
      .attr("y", 22)
      .attr("x", 4)
      .append("rect")
      .attr("width", "70px")
      .attr("rx", 10)
      .attr("ry", 10);

    return {
      cx: correct_x - 26,
      cy: correct_y - 45,
    };
  }

  const that = $("svg[block_id=" + mainWrapObj.rect_id + "]")[0];

  if (d3.select(that).select("svg").selectAll(".input-wrap").size() < 1) {
    d3.select(that)
      .select("svg")
      .insert("foreignObject")
      .attr("class", "input-wrap")
      .attr("width", "80")
      .attr("height", "60")
      .html(
        '<input type="text" value="" size="3"/><div class="rect_image"></div>'
      );
  }

  $(".input-wrap input").prop("readonly", false);
  $(that).find("input")[0].focus();

  mainWrapObj.selectBlock(that);
  mainWrapObj.initCanvas();
  mainWrapObj.saveState();
};

mainWrapObj.resetBlock = function resetBlock() {
  $(".btn-del-wrap").hide();
  $(".btn-arrow-wrap").hide();
  $(".btn-line-wrap").hide();
  $(".btn-line-move").hide();
  $(".btn-new-line").remove();
  $(".btn-cross-line").remove();
  $(".contextmenu_wrap").hide();
  $(".line_contextmenu_wrap").hide();
  $(".cross_contextmenu_wrap").hide();
  $(".note_contextmenu_wrap").hide();
  $(".main_contextmenu_wrap").hide();
  $(".btn-plus-wrap").hide();
  $(".btn-note-wrap").hide();

  mainWrapObj.selectObj(0);
  $(".wire").attr("stroke", "transparent");
  $(".cross_wire").attr("stroke", "transparent");
};

mainWrapObj.linePosition = function linePosition(
  from_x,
  from_y,
  to_x,
  to_y,
  selected,
  to_id
) {
  var start_x = from_x;
  var start_y = from_y;
  var end_x = to_x;
  var end_y = to_y;
  const selected_width = parseFloat(d3.select(selected).attr("width"));
  const selected_height = parseFloat(d3.select(selected).attr("height"));
  const to_width = parseFloat($("svg[block_id=" + to_id + "]").attr("width"));
  const to_height = parseFloat($("svg[block_id=" + to_id + "]").attr("height"));

  const padding = 10;

  start_x = from_x + selected_width / 2;
  start_y = from_y + selected_height / 2 + padding;

  end_x = to_x + to_width / 2;
  end_y = to_y + to_height / 2 + padding;

  return [start_x, start_y, end_x, end_y];
};

mainWrapObj.drawWire = function drawWire(
  from1,
  to1,
  line_id,
  from_id,
  to_id,
  selected,
  curr_level,
  changed,
  middle,
  display
) {
  const pos_arr = mainWrapObj.linePosition(
    from1[0],
    from1[1],
    to1[0],
    to1[1],
    selected,
    to_id
  );

  const from = [pos_arr[0], pos_arr[1]];
  const to = [pos_arr[2], pos_arr[3]];

  var Gen = d3.line().curve(d3.curveBasis);

  const wire_length = to[0] - from[0];
  const wire_length_pc = wire_length / 100;
  const wire_height = from[1] - to[1];
  const wire_height_pc = wire_height / 100;

  const middle_1 = [
    from[0] + wire_length_pc * 40,
    from[1] - wire_height_pc * 20,
  ];
  const middle_2 = [
    from[0] + wire_length_pc * 60,
    from[1] - wire_height_pc * 90,
  ];

  var points = [from, middle_1, middle_2, to];

  if (changed == true || changed == "true") {
    const between_x = (to[0] - from[0]) / 15;
    const between_y = (to[1] - from[1]) / 15;

    middle[0] = parseFloat(middle[0]);
    middle[1] = parseFloat(middle[1]);

    points = [
      from,
      [middle[0] - between_x, middle[1] - between_y],
      middle,
      [middle[0] + between_x, middle[1] + between_y],
      to,
    ];
  } else {
    changed = "false";
    middle = [];
  }

  const pathOfLine = Gen(points);

  svg
    .append("path")
    .attr("class", "wire")
    .attr("d", pathOfLine)
    .attr("changed", changed)
    .attr("middle", middle.join(","))
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", "14")
    .attr("wire_id", line_id)
    .attr("from_id", from_id)
    .attr("to_id", to_id)
    .attr("level", curr_level)
    .attr("display", display);

  this.drawWirein(pathOfLine, line_id);

  this.lineInit();

  this.indexUP();
};

mainWrapObj.drawCrossWire = function drawCrossWire(
  from1,
  to1,
  line_id,
  from_id,
  to_id,
  selected,
  curr_level,
  changed,
  middle,
  display
) {
  const pos_arr = mainWrapObj.linePosition(
    from1[0],
    from1[1],
    to1[0],
    to1[1],
    selected,
    to_id
  );

  const from = [pos_arr[0], pos_arr[1]];
  const to = [pos_arr[2], pos_arr[3]];

  const Gen = d3.line().curve(d3.curveBasis);

  const wire_length = to[0] - from[0];
  const wire_length_pc = wire_length / 100;
  const wire_height = from[1] - to[1];
  const wire_height_pc = wire_height / 100;

  const middle_1 = [
    from[0] + wire_length_pc * 40,
    from[1] - wire_height_pc * 20,
  ];
  const middle_2 = [
    from[0] + wire_length_pc * 60,
    from[1] - wire_height_pc * 90,
  ];

  var points = [from, middle_1, middle_2, to];

  if (changed == true || changed == "true") {
    const between_x = (to[0] - from[0]) / 15;
    const between_y = (to[1] - from[1]) / 15;

    middle[0] = parseFloat(middle[0]);
    middle[1] = parseFloat(middle[1]);

    points = [
      from,
      [middle[0] - between_x, middle[1] - between_y],
      middle,
      [middle[0] + between_x, middle[1] + between_y],
      to,
    ];
  } else {
    changed = "false";
    middle = [];
  }

  const pathOfLine = Gen(points);

  svg
    .append("path")
    .attr("class", "cross_wire")
    .attr("d", pathOfLine)
    .attr("changed", changed)
    .attr("middle", middle.join(","))
    .attr("fill", "none")
    .attr("stroke", "transparent")
    .attr("stroke-width", "10")
    .attr("wire_id", line_id)
    .attr("from_id", from_id)
    .attr("to_id", to_id)
    .attr("level", curr_level)
    .attr("display", display);

  this.drawCrossWirein(pathOfLine, line_id);

  this.lineInit();

  this.indexUP();
};

mainWrapObj.drawWirein = function drawWirein(pathOfLine, wirein_id) {
  const wire = $(".wire[wire_id=" + wirein_id + "]");
  const curr_level = wire.attr("level");

  $(".wirein[wirein_id=" + wirein_id + "]").remove();

  svg
    .append("path")
    .attr("class", "wirein ")
    .attr("d", pathOfLine)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "5")
    .attr("stroke-dasharray", "3,2")
    .attr("wirein_id", wirein_id)
    .attr("level", curr_level)
    .attr("display", wire.attr("display"));

  this.indexUP();
};

mainWrapObj.drawCrossWirein = function drawCrossWirein(pathOfLine, wirein_id) {
  const wire = $(".cross_wire[wire_id=" + wirein_id + "]");
  const curr_level = wire.attr("level");

  $(".cross_wirein[wirein_id=" + wirein_id + "]").remove();

  svg
    .append("path")
    .attr("class", "cross_wirein ")
    .attr("d", pathOfLine)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", "3")
    .attr("stroke-dasharray", "3,4")
    .attr("wirein_id", wirein_id)
    .attr("level", curr_level)
    .attr("display", wire.attr("display"));

  this.indexUP();
};

mainWrapObj.redrawLines = function redrawLines(lines) {
  if (lines != undefined) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] != null && lines[i].replace(/ /gi, "") !== "") {
        const it = $(".wire[wire_id=" + lines[i] + "]");
        const from_id = it.attr("from_id");
        const to_id = it.attr("to_id");
        const from = $("svg[block_id=" + from_id + "]");
        const to = $("svg[block_id=" + to_id + "]");
        const line_id = lines[i];

        const pos_arr = [
          parseFloat(from.attr("x")),
          parseFloat(from.attr("y")),
          parseFloat(to.attr("x")),
          parseFloat(to.attr("y")),
          from[0],
        ];

        const start = [pos_arr[0], pos_arr[1]];
        const end = [pos_arr[2], pos_arr[3]];

        const changed = it.attr("changed");

        var middle = it.attr("middle");

        if (changed == true || changed == "true") {
          middle = middle.split(",");
        }

        const display = $(".wire[wire_id=" + lines[i] + "]").css("display");

        $(".wire[wire_id=" + lines[i] + "]").remove();
        $(".wirein[wirein_id=" + lines[i] + "]").remove();

        this.drawWire(
          start,
          end,
          line_id,
          from_id,
          to_id,
          from[0],
          $("svg[block_id=" + to_id + "]").attr("level"),
          changed,
          middle,
          display
        );
      }
    }
  }
};

mainWrapObj.redrawCrossLines = function redrawCrossLines(lines) {
  if (lines != undefined) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] != null && lines[i].replace(/ /gi, "") !== "") {
        const it = $(".cross_wire[wire_id=" + lines[i] + "]");
        const from_id = it.attr("from_id");
        const to_id = it.attr("to_id");
        const from = $("svg[block_id=" + from_id + "]");
        const to = $("svg[block_id=" + to_id + "]");
        const line_id = lines[i];

        const pos_arr = [
          parseFloat(from.attr("x")),
          parseFloat(from.attr("y")),
          parseFloat(to.attr("x")),
          parseFloat(to.attr("y")),
          from[0],
        ];

        const start = [pos_arr[0], pos_arr[1]];
        const end = [pos_arr[2], pos_arr[3]];

        const changed = it.attr("changed");

        var middle = it.attr("middle");

        if (changed == true || changed == "true") {
          middle = middle.split(",");
        }

        const display = $(".cross_wire[wire_id=" + lines[i] + "]").css(
          "display"
        );

        $(".cross_wire[wire_id=" + lines[i] + "]").remove();
        $(".cross_wirein[wirein_id=" + lines[i] + "]").remove();

        mainWrapObj.drawCrossWire(
          start,
          end,
          line_id,
          from_id,
          to_id,
          from[0],
          $("svg[block_id=" + to_id + "]").attr("level"),
          changed,
          middle,
          display
        );
      }
    }
  }
};

mainWrapObj.removeBlock = function removeBlock(block) {
  var cross_wire_arr = $(block).attr("crosswireoutarr");

  if (cross_wire_arr != undefined) {
    cross_wire_arr = cross_wire_arr.split(",");

    for (let i = 0; i < cross_wire_arr.length; i++) {
      if (
        cross_wire_arr[i] != null &&
        cross_wire_arr[i] !== "" &&
        cross_wire_arr[i].replace(/ /gi, "") !== ""
      ) {
        var block_id = $(".cross_wire[wire_id=" + cross_wire_arr[i] + "]").attr(
          "to_id"
        );

        $(".cross_wire[wire_id=" + cross_wire_arr[i] + "]").remove();
        $(".cross_wirein[wirein_id=" + cross_wire_arr[i] + "]").remove();

        var cross_arr_in = $("svg[block_id=" + block_id + "]").attr(
          "crosswireinarr"
        );

        if (cross_arr_in != undefined) {
          cross_arr_in = cross_arr_in.split(",");

          var cross_arr_in_new = cross_arr_in.filter(
            (id) => id != cross_wire_arr[i]
          );

          cross_arr_in_new = cross_arr_in_new.join(",");

          $("svg[block_id=" + block_id + "]").attr(
            "crosswireinarr",
            cross_arr_in_new
          );
        }
      }
    }
  }

  var cross_wirein_arr = $(block).attr("crosswireinarr");

  if (cross_wirein_arr != undefined) {
    cross_wirein_arr = cross_wirein_arr.split(",");

    for (let i = 0; i < cross_wirein_arr.length; i++) {
      if (
        cross_wirein_arr[i] != null &&
        cross_wirein_arr[i] !== "" &&
        cross_wirein_arr[i].replace(/ /gi, "") !== ""
      ) {
        const block_id = $(
          ".cross_wire[wire_id=" + cross_wirein_arr[i] + "]"
        ).attr("from_id");

        $(".cross_wire[wire_id=" + cross_wirein_arr[i] + "]").remove();
        $(".cross_wirein[wirein_id=" + cross_wirein_arr[i] + "]").remove();

        var cross_arr_out = $("svg[block_id=" + block_id + "]").attr(
          "crosswireoutarr"
        );

        if (cross_arr_out != undefined) {
          cross_arr_out = cross_arr_out.split(",");

          let cross_arr_out_new = cross_arr_out.filter(
            (id) => id != cross_wirein_arr[i]
          );

          cross_arr_out_new = cross_arr_out_new.join(",");

          $("svg[block_id=" + block_id + "]").attr(
            "crosswireoutarr",
            cross_arr_out_new
          );
        }
      }
    }
  }

  var wire_arr = $(block).attr("wireoutarr");

  const line_in_id = $(block).attr("line_in");

  if (line_in_id != undefined && line_in_id !== "") {
    var from_id = parseInt(
      $(".wire[wire_id=" + line_in_id + "]").attr("from_id")
    );

    if ($("svg[block_id=" + from_id + "]").length > 0) {
      var from_wireoutarr = $("svg[block_id=" + from_id + "]").attr(
        "wireoutarr"
      );

      if (from_wireoutarr != undefined) {
        from_wireoutarr = from_wireoutarr.split(",");

        var from_wireoutarr_new = from_wireoutarr.filter(
          (id) => id != line_in_id
        );

        from_wireoutarr_new = from_wireoutarr_new.join(",");

        $("svg[block_id=" + from_id + "]").attr(
          "wireoutarr",
          from_wireoutarr_new
        );
      }
    }
  }
  $(block).remove();

  $(".simple_note[index=" + $(block).attr("block_id") + "]").remove();

  if (line_in_id != undefined && line_in_id !== "") {
    $(".wire[wire_id=" + line_in_id + "]").remove();
    $(".wirein[wirein_id=" + line_in_id + "]").remove();
  }

  if (wire_arr != undefined) {
    wire_arr = wire_arr.split(",");

    for (let i = 0; i < wire_arr.length; i++) {
      if (
        wire_arr[i] != null &&
        wire_arr[i] !== "" &&
        wire_arr[i].replace(/ /gi, "") !== ""
      ) {
        const block_id = $(".wire[wire_id=" + wire_arr[i] + "]").attr("to_id");

        $(".wire[wire_id=" + wire_arr[i] + "]").remove();
        $(".wirein[wirein_id=" + wire_arr[i] + "]").remove();

        mainWrapObj.removeBlock("svg[block_id=" + block_id + "]");
      }
    }
  }

  this.resetBlock();
};

mainWrapObj.indexUP = function indexUP() {
  d3.selectAll(".wirein").each(function (d, i) {
    d3.select(this).lower();
  });

  d3.selectAll(".wire").each(function (d, i) {
    d3.select(this).lower();
  });

  d3.selectAll(".cross_wirein").each(function (d, i) {
    d3.select(this).lower();
  });

  d3.selectAll(".cross_wire").each(function (d, i) {
    d3.select(this).lower();
  });
};

mainWrapObj.clearEmpty = function clearEmpty() {
  d3.selectAll(".rect_wrap").each(function (d, i) {
    if (Number(d3.select(this).attr("level")) > 0) {
      if (
        d3.select(this).attr("wireoutarr") == undefined ||
        d3.select(this).attr("wireoutarr") === ""
      ) {
        if (d3.select(this).select("input").size() === 0) {
          mainWrapObj.removeBlock(this);
        } else {
          if (d3.select(this).select("input").attr("value").length === 0) {
            mainWrapObj.removeBlock(this);
          }
        }
      }
    }
  });
};

mainWrapObj.hideChildren = function hideChildren(
  block,
  btn,
  status,
  cross_line
) {
  if (status != "none") {
    btn.find(".btn-arrow").attr("hide_state", "true");
  }

  if (cross_line == true) {
    var cross_wire_arr = $(block).attr("crosswireoutarr");

    if (cross_wire_arr != undefined) {
      cross_wire_arr = cross_wire_arr.split(",");

      for (let i = 0; i < cross_wire_arr.length; i++) {
        if (cross_wire_arr[i] != null && cross_wire_arr[i] !== "") {
          var curr_cross_wire = $(
            ".cross_wire[wire_id=" + cross_wire_arr[i] + "]"
          );

          curr_cross_wire.fadeOut(100);
          $(".cross_wirein[wirein_id=" + cross_wire_arr[i] + "]").fadeOut(
            100,
            function () {
              // Animation complete.
            }
          );
        }
      }
    }

    var cross_wirein_arr = $(block).attr("crosswireinarr");

    if (cross_wirein_arr != undefined) {
      cross_wirein_arr = cross_wirein_arr.split(",");

      for (let i = 0; i < cross_wirein_arr.length; i++) {
        if (cross_wirein_arr[i] != null && cross_wirein_arr[i] !== "") {
          var curr_cross_wirein = $(
            ".cross_wire[wire_id=" + cross_wirein_arr[i] + "]"
          );

          curr_cross_wirein.fadeOut(100);
          $(".cross_wirein[wirein_id=" + cross_wirein_arr[i] + "]").fadeOut(
            100,
            function () {
              // Animation complete.
            }
          );
        }
      }
    }
  }

  var wire_arr = $(block).attr("wireoutarr");

  if (wire_arr != undefined) {
    wire_arr = wire_arr.split(",");

    for (let i = 0; i < wire_arr.length; i++) {
      if (wire_arr[i] != null && wire_arr[i] !== "") {
        const curr_wire = $(".wire[wire_id=" + wire_arr[i] + "]");
        const block_id = curr_wire.attr("to_id");

        curr_wire.fadeOut(100);
        $(".wirein[wirein_id=" + wire_arr[i] + "]").fadeOut(100, function () {
          // Animation complete.
        });

        const curr_block = $("svg[block_id=" + block_id + "]");

        curr_block.fadeOut(100);

        var btn_next = curr_block.find(".btn-arrow-wrap");

        mainWrapObj.hideChildren(
          "svg[block_id=" + block_id + "]",
          btn_next,
          "none",
          true
        );
      }
    }
  }
};

mainWrapObj.showChildren = function showChildren(block, btn) {
  btn.find(".btn-arrow").attr("hide_state", "false");

  var cross_wire_arr = $(block).attr("crosswireoutarr");

  if (cross_wire_arr != undefined) {
    cross_wire_arr = cross_wire_arr.split(",");

    for (let i = 0; i < cross_wire_arr.length; i++) {
      if (cross_wire_arr[i] != null && cross_wire_arr[i] !== "") {
        const block_to_id = $(
          ".cross_wire[wire_id=" + cross_wire_arr[i] + "]"
        ).attr("to_id");
        const block_from_id = $(
          ".cross_wire[wire_id=" + cross_wire_arr[i] + "]"
        ).attr("from_id");

        if (
          $("svg[block_id=" + block_to_id + "]").css("display") != "none" &&
          $("svg[block_id=" + block_from_id + "]").css("display") != "none"
        ) {
          $(".cross_wire[wire_id=" + cross_wire_arr[i] + "]").fadeIn(100);
          $(".cross_wirein[wirein_id=" + cross_wire_arr[i] + "]").fadeIn(
            100,
            function () {
              // Animation complete.
            }
          );
        }
      }
    }
  }

  var cross_wirein_arr = $(block).attr("crosswireinarr");

  if (cross_wirein_arr != undefined) {
    cross_wirein_arr = cross_wirein_arr.split(",");

    for (let i = 0; i < cross_wirein_arr.length; i++) {
      if (cross_wirein_arr[i] != null && cross_wirein_arr[i] !== "") {
        const curr_cross_wire = $(
          ".cross_wire[wire_id=" + cross_wirein_arr[i] + "]"
        );
        const block_to_id = curr_cross_wire.attr("to_id");
        const block_from_id = curr_cross_wire.attr("from_id");

        if (
          $("svg[block_id=" + block_to_id + "]").css("display") != "none" &&
          $("svg[block_id=" + block_from_id + "]").css("display") != "none"
        ) {
          curr_cross_wire.fadeIn(100);
          $(".cross_wirein[wirein_id=" + cross_wirein_arr[i] + "]").fadeIn(
            100,
            function () {
              // Animation complete.
            }
          );
        }
      }
    }
  }

  var wire_arr = $(block).attr("wireoutarr");

  if (wire_arr != undefined) {
    wire_arr = wire_arr.split(",");

    for (let i = 0; i < wire_arr.length; i++) {
      if (wire_arr[i] != null && wire_arr[i] !== "") {
        const curr_cross_wirein = $(".wire[wire_id=" + wire_arr[i] + "]");
        const block_id = curr_cross_wirein.attr("to_id");

        curr_cross_wirein.fadeIn(100);
        $(".wirein[wirein_id=" + wire_arr[i] + "]").fadeIn(100);

        $("svg[block_id=" + block_id + "]").fadeIn(100);

        const btn_next = $("svg[block_id=" + block_id + "]").find(
          ".btn-arrow-wrap"
        );

        if (btn_next.find(".btn-arrow").attr("hide_state") !== "true") {
          mainWrapObj.showChildren("svg[block_id=" + block_id + "]", btn_next);
        }
      }
    }
  }
};

mainWrapObj.checkIntersection = function checkIntersection(a, b) {
  const x = parseFloat(d3.select(b).attr("x"));
  const y = parseFloat(d3.select(b).attr("y")) + 20;
  const w = parseFloat(d3.select(b).select("rect").attr("width")) + 10;
  const h = 50;

  if (a.x > x && a.x < x + w) {
    if (a.y > y && a.y < y + h) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

mainWrapObj.handlerPosition = function handlerPosition(id, length) {
  var loc_length = length || 20;
  const wire = $(".wire[wire_id=" + id + "]")[0];
  const from_id = $(wire).attr("from_id");
  const block = $(".rect_wrap[block_id=" + from_id + "]")[0];

  const point_1 = d3.select(wire).node().getPointAtLength(loc_length);

  var pos = {
    x: point_1.x,
    y: point_1.y,
  };

  var state = this.checkIntersection(pos, block);

  while (state == true) {
    var point_new = d3
      .select(wire)
      .node()
      .getPointAtLength(loc_length + 0.4);

    pos = {
      x: point_new.x,
      y: point_new.y,
    };
    state = this.checkIntersection(pos, block);
    loc_length = loc_length + 0.4;
  }

  d3.select(".btn-line-move").attr("cx", pos.x);
  d3.select(".btn-line-move").attr("cy", pos.y);
};

mainWrapObj.drawAccess = function drawAccess(that) {
  var point_1 = d3.select(that).node().getPointAtLength(20);

  $(".btn-line-wrap").remove();
  $(".btn-line-move").remove();

  d3.select(that.parentNode)
    .insert("circle")
    .attr("class", "btn-line-move")
    //.attr("stroke", "white")
    .attr("fill", "gray")
    .attr("r", 6)
    .attr("cx", point_1.x)
    .attr("cy", point_1.y)
    .attr("line_id", d3.select(that).attr("wire_id"));

  var all_rect_wrap = d3.selectAll(".rect_wrap");

  var objt = {
    exeption: [],
  };

  mainWrapObj.getAllChildren(d3.select(that).attr("to_id"), objt.exeption);

  const exeption = objt.exeption;

  exeption.push(d3.select(that).attr("from_id"));
  exeption.push(d3.select(that).attr("to_id"));

  var selectedLocation;

  const dragHandler3 = d3
    .drag()
    .on("drag", function (event) {
      all_rect_wrap.select("rect").classed("rect_shine", false);
      clearTimeout(mainWrapObj.clearSelected);
      $(".btn-line-move").show();

      $(".guide_line").remove();
      d3.select(this).attr("cx", event.x).attr("cy", event.y);

      const line_id = $(this).attr("line_id");
      const to_id = $(".wire[wire_id=" + line_id + "]").attr("to_id");
      const to = $(".rect_wrap[block_id=" + to_id + "]");

      const start_x =
        parseFloat(to.attr("x")) + parseFloat(to.attr("width")) / 2;
      const start_y =
        parseFloat(to.attr("y")) + parseFloat(to.attr("height")) / 2;

      const points = [
        [start_x, start_y],
        [event.x, event.y],
      ];

      const Gen = d3.line().curve(d3.curveLinear);

      const pathOfLine = Gen(points);

      svg
        .append("path")
        .attr("class", "guide_line")
        .attr("d", pathOfLine)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", "5");

      selectedLocation = mainWrapObj.findIntersections(event, exeption);
    })
    .on("end", function (event) {
      $(".btn-line-move").hide();
      $(".btn-line").hide();
      $(".guide_line").remove();
      d3.selectAll(".rect_wrap").select("rect").classed("rect_shine", false);

      mainWrapObj.saveState();

      if (selectedLocation != undefined) {
        const line_id = $(this).attr("line_id");
        const line_level = parseInt(
          $(".wire[wire_id=" + line_id + "]").attr("level")
        );
        const to_id = $(".wire[wire_id=" + line_id + "]").attr("to_id");
        const to = $(".rect_wrap[block_id=" + to_id + "]")[0];
        const from_id = $(".wire[wire_id=" + line_id + "]").attr("from_id");
        const from = $(".rect_wrap[block_id=" + from_id + "]")[0];
        var locationWirePack = d3.select(selectedLocation).attr("wireoutarr");

        const end_x =
          parseFloat(d3.select(to).attr("x")) +
          parseFloat(d3.select(to).attr("width")) / 2;
        const end_y =
          parseFloat(d3.select(to).attr("y")) +
          parseFloat(d3.select(to).attr("height")) / 2;
        const start_x =
          parseFloat(d3.select(selectedLocation).attr("x")) +
          parseFloat(d3.select(selectedLocation).attr("width")) / 2;
        const start_y =
          parseFloat(d3.select(selectedLocation).attr("y")) +
          parseFloat(d3.select(selectedLocation).attr("height")) / 2;

        if (locationWirePack !== "" && locationWirePack != undefined) {
          locationWirePack = locationWirePack.split(",");
        } else {
          locationWirePack = [];
        }

        $(".wire[wire_id=" + line_id + "]").remove();
        $(".wirein[wirein_id=" + line_id + "]").remove();

        const level_diff =
          line_level -
          (parseInt(d3.select(selectedLocation).attr("level")) + 1);

        mainWrapObj.drawWire(
          [start_x - 40, start_y - 40],
          [end_x - 40, end_y - 40],
          line_id,
          d3.select(selectedLocation).attr("block_id"),
          to_id,
          selectedLocation,
          parseInt(d3.select(selectedLocation).attr("level")) + 1
        );

        locationWirePack.push(line_id);
        d3.select(selectedLocation).attr(
          "wireoutarr",
          locationWirePack.join(",")
        );

        var fromWirePack = d3.select(from).attr("wireoutarr").split(",");
        fromWirePack = fromWirePack.filter((elm) => elm != line_id);
        d3.select(from).attr("wireoutarr", fromWirePack.join(","));

        mainWrapObj.levelMove($(to), level_diff);
        mainWrapObj.saveState();
      }
    });

  dragHandler3(svg.selectAll(".btn-line-move"));
};

mainWrapObj.lineInit = function lineInit() {
  svg.selectAll(".wire").on("click", function (event) {
    event.stopPropagation();
  });

  svg.selectAll(".wire").on("mousedown", function (event) {
    mainWrapObj.resetBlock();
    mainWrapObj.selectObj(2, this);

    d3.select(this).attr("stroke", "#c8dcef");

    mainWrapObj.drawAccess(this);
    mainWrapObj.handlerPosition($(this).attr("wire_id"), 20);
    mainWrapObj.selectObj(2, this);
  });

  svg.selectAll(".wire").on("contextmenu", function (event) {
    event.stopPropagation();
    event.preventDefault();
    //event.target;

    const wrap_pos = $(".workspace_wrap")[0].getBoundingClientRect();

    const correct_x = event.x - wrap_pos.x;
    const correct_y = event.y - wrap_pos.y;

    $(".line_contextmenu_wrap").show();

    $(".line_contextmenu_wrap").css("left", correct_x + 30);

    $(".line_contextmenu_wrap").css("top", correct_y);

    mainWrapObj.selectObj(2, this);
  });

  svg.selectAll(".cross_wire").on("click", function (event) {
    event.stopPropagation();
  });

  svg.selectAll(".cross_wire").on("mousedown", function (event) {
    mainWrapObj.resetBlock();
    mainWrapObj.selectObj(3, this);
    $(".input-wrap input").prop("readonly", true);
    d3.select(this).attr("stroke", "#c8dcef");
  });

  svg.selectAll(".cross_wire").on("contextmenu", function (event) {
    event.stopPropagation();
    event.preventDefault();

    const wrap_pos = $(".workspace_wrap")[0].getBoundingClientRect();

    const correct_x = event.x - wrap_pos.x;
    const correct_y = event.y - wrap_pos.y;

    $(".cross_contextmenu_wrap").show();

    $(".cross_contextmenu_wrap").css("left", correct_x + 30);

    $(".cross_contextmenu_wrap").css("top", correct_y);

    mainWrapObj.selectObj(3, this);
  });

  const dragHandler2 = d3
    .drag()
    .on("drag", function (event) {
      const Gen = d3.line().curve(d3.curveBasis);

      var curr_points = d3
        .select(this)
        .attr("d")
        .split(/(?=[LMC])/);

      const last = curr_points.length - 1;

      curr_points = [
        curr_points[0].replace(/[A-Za-z]/gi, "").split(","),
        curr_points[last].replace(/[A-Za-z]/gi, "").split(","),
      ];

      const between_x = (curr_points[1][0] - curr_points[0][0]) / 15;
      const between_y = (curr_points[1][1] - curr_points[0][1]) / 15;

      const points_new = [
        [curr_points[0][0], curr_points[0][1]],
        [event.x - between_x, event.y - between_y],
        [event.x, event.y],
        [event.x + between_x, event.y + between_y],
        [curr_points[1][0], curr_points[1][1]],
      ];

      const pathOfLine = Gen(points_new);

      d3.select(this).attr("stroke", "#c8dcef");

      $(".btn-line-wrap").remove();
      $(".btn-line-move").remove();

      d3.select(this).attr("d", pathOfLine);

      d3.select(this).attr("changed", true);

      d3.select(this).attr("middle", [event.x, event.y].join(","));

      mainWrapObj.drawWirein(pathOfLine, d3.select(this).attr("wire_id"));
    })
    .on("start", function (e) {
      mainWrapObj.saveState();
    })
    .on("end", function (e) {
      mainWrapObj.saveState();
      mainWrapObj.drawAccess(this);
      mainWrapObj.handlerPosition($(this).attr("wire_id"), 20);
    });

  dragHandler2(svg.selectAll(".wire"));

  const dragHandlerCross2 = d3
    .drag()
    .on("drag", function (event) {
      const Gen = d3.line().curve(d3.curveBasis);

      var curr_points = d3
        .select(this)
        .attr("d")
        .split(/(?=[LMC])/);

      const last = curr_points.length - 1;

      curr_points = [
        curr_points[0].replace(/[A-Za-z]/gi, "").split(","),
        curr_points[last].replace(/[A-Za-z]/gi, "").split(","),
      ];

      const between_x = (curr_points[1][0] - curr_points[0][0]) / 15;
      const between_y = (curr_points[1][1] - curr_points[0][1]) / 15;

      const points_new = [
        [curr_points[0][0], curr_points[0][1]],
        [event.x - between_x, event.y - between_y],
        [event.x, event.y],
        [event.x + between_x, event.y + between_y],
        [curr_points[1][0], curr_points[1][1]],
      ];

      const pathOfLine = Gen(points_new);

      d3.select(this).attr("stroke", "#c8dcef");

      $(".btn-line-wrap").remove();
      $(".btn-line-move").remove();

      d3.select(this).attr("d", pathOfLine);

      d3.select(this).attr("changed", true);

      d3.select(this).attr("middle", [event.x, event.y].join(","));

      mainWrapObj.drawCrossWirein(pathOfLine, d3.select(this).attr("wire_id"));
    })
    .on("start", function (e) {
      mainWrapObj.saveState();
    })
    .on("end", function (e) {
      mainWrapObj.saveState();
    });

  dragHandlerCross2(svg.selectAll(".cross_wire"));
};

mainWrapObj.initNotes = function initNotes() {
  var dragHandlerNote = d3
    .drag()
    .on("drag", function (event) {
      d3.select(this).attr("x", event.x).attr("y", event.y);
    })
    .on("start", function (e) {})
    .on("end", function (e) {});

  dragHandlerNote(svg.selectAll(".notepoint_wrap"));

  svg.selectAll(".notepoint_wrap").on("contextmenu", function (event) {
    event.stopPropagation();
    event.preventDefault();
    //event.target;

    var wrap_pos = $(".workspace_wrap")[0].getBoundingClientRect();

    var correct_x = event.x - wrap_pos.x;
    var correct_y = event.y - wrap_pos.y;

    $(".note_contextmenu_wrap").show();

    $(".note_contextmenu_wrap").css("left", correct_x + 30);

    $(".note_contextmenu_wrap").css("top", correct_y);

    mainWrapObj.selectObj(4, this);
  });

  svg.selectAll(".notepoint_wrap").on("click", function (event) {
    event.stopPropagation();
    event.preventDefault();
    mainWrapObj.selectObj(4, this);
  });

  svg.selectAll(".notepoint_wrap").on("dblclick", function (event) {
    event.stopPropagation();
    event.preventDefault();
    mainWrapObj.selectObj(4, this);
    mainWrapObj.modalShow();
  });
};

mainWrapObj.initCanvas = function initCanvas() {
  var px = 0;
  var py = 0;

  $(".rect_wrap input").on("keyup", mainWrapObj.inputUpdate);
  $(".rect_wrap input").on("change", mainWrapObj.inputUpdate);

  this.lineInit();
  this.initNotes();
  svg.on("contextmenu", function (event) {
    event.stopPropagation();
    event.preventDefault();
    mainWrapObj.resetBlock();

    var wrap_pos = $(".workspace_wrap")[0].getBoundingClientRect();

    var correct_x = event.x - wrap_pos.x;
    var correct_y = event.y - wrap_pos.y;

    mainWrapObj.clickPos = [event.x, event.y];

    $(".main_contextmenu_wrap").show();

    $(".main_contextmenu_wrap").css("left", correct_x + 30);

    $(".main_contextmenu_wrap").css("top", correct_y);
  });

  svg.selectAll(".rect_wrap").on("mousedown", function (event) {
    px =
      event.x - parseFloat(d3.select(this).attr("x") * mainWrapObj.canvasZoom);
    py =
      event.y - parseFloat(d3.select(this).attr("y") * mainWrapObj.canvasZoom);
  });

  svg.selectAll(".rect_wrap").on("mouseover", function (event) {});

  svg.selectAll(".rect_wrap").on("click", function (event) {
    event.stopPropagation();
    mainWrapObj.resetBlock();

    mainWrapObj.selectBlock(this);
  });

  svg.selectAll(".rect_wrap").on("dblclick", function (event) {
    event.stopPropagation();

    $(this).find("input").prop("readonly", false);
    $(this).find("input")[0].selectionStart = $(this)
      .find("input")
      .val().length;
    $(this).find("input")[0].selectionEnd = $(this).find("input").val().length;
  });

  svg.selectAll(".rect_wrap").on("contextmenu", function (event) {
    event.stopPropagation();
    event.preventDefault();

    mainWrapObj.selectBlock(this);

    var wrap_pos = $(".workspace_wrap")[0].getBoundingClientRect();

    var correct_x = event.x - wrap_pos.x;
    var correct_y = event.y - wrap_pos.y;

    $(".contextmenu_wrap").show();

    $(".contextmenu_wrap").css("left", correct_x + 30);

    $(".contextmenu_wrap").css("top", correct_y);
  });

  const dragHandler = d3
    .drag()
    .on("drag", function (event) {
      const wrap_pos = $(".workspace")[0].getBoundingClientRect();

      const correct_x = event.x + wrap_pos.x;
      const correct_y = event.y + wrap_pos.y;

      const width_rect = parseFloat(d3.select(this).attr("width"));

      if (
        correct_x - px >= 0 &&
        correct_x - px <= wrap_pos.width / mainWrapObj.canvasZoom - width_rect
      ) {
        d3.select(this).attr("x", correct_x - px);
      }

      if (
        correct_y - py >= 0 &&
        correct_y - py <= wrap_pos.height / mainWrapObj.canvasZoom - 80
      ) {
        d3.select(this).attr("y", correct_y - py);
      }

      var lines = d3.select(this).attr("wireoutarr");
      if (lines != null && lines != undefined) {
        lines = lines.split(",");
        lines.push(d3.select(this).attr("line_in"));
      }

      var cross_lines_out = d3.select(this).attr("crosswireoutarr");
      if (cross_lines_out != null && cross_lines_out != undefined) {
        cross_lines_out = cross_lines_out.split(",");
      }

      var cross_lines_in = d3.select(this).attr("crosswireinarr");
      if (cross_lines_in != null && cross_lines_in != undefined) {
        cross_lines_in = cross_lines_in.split(",");
      }

      mainWrapObj.redrawLines(lines);
      mainWrapObj.redrawCrossLines(cross_lines_out);
      mainWrapObj.redrawCrossLines(cross_lines_in);
      mainWrapObj.resetBlock();
    })
    .on("end", function () {
      mainWrapObj.saveState();
      mainWrapObj.selectBlock(this);
    });

  dragHandler(svg.selectAll(".rect_wrap"));
};

mainWrapObj.rectWidth = function rectWidth(it, that) {
  const img_width = parseFloat($(that).find(".rect_image").width()) || 10;

  const borders = 10;

  const shift =
    ($(it).width() +
      borders +
      img_width -
      parseFloat($(that).find("rect").attr("width"))) /
    2;

  $(it)
    .parent()
    .attr("width", $(it).width() + borders + img_width); //rect_wrap

  $(that)
    .find("rect")
    .attr("width", $(it).width() + borders + img_width); //rect

  $(that).attr("width", $(it).width() + borders * 2 + img_width);

  if (shift > 0) {
    $(that).attr("x", parseFloat($(that).attr("x")) - parseFloat(shift));
  } else {
    $(that).attr("x", parseFloat($(that).attr("x")) - parseFloat(shift));
  }
};

mainWrapObj.getAllChildren = function getAllChildren(id, arr) {
  if (arr == undefined) {
    var arr = [];
  }

  const block = $("svg[block_id=" + id + "]");

  var wire_arr = $(block).attr("wireoutarr");

  if (wire_arr != undefined) {
    wire_arr = wire_arr.replace(/ /gi, "");
  }

  if (wire_arr != undefined && wire_arr !== "") {
    wire_arr = wire_arr.replace(/ /gi, "").split(",");

    for (let i = 0; i < wire_arr.length; i++) {
      if (
        wire_arr[i] != null &&
        wire_arr[i] !== "" &&
        wire_arr[i].replace(/ /gi, "") !== ""
      ) {
        const block_id = $(".wire[wire_id=" + wire_arr[i] + "]").attr("to_id");

        arr.push(block_id);

        const this_block = $("svg[block_id=" + block_id + "]");

        var this_wire_arr = this_block.attr("wireoutarr");

        if (this_wire_arr != undefined) {
          this_wire_arr = this_wire_arr.replace(/ /gi, "");
        }

        if (this_wire_arr != undefined && this_wire_arr !== "") {
          mainWrapObj.getAllChildren(block_id, arr);
        } else {
          if (i < wire_arr.length - 1) {
            continue;
          }
        }
      } else {
        if (i < wire_arr.length - 1) {
          continue;
        }
      }
    }
  }
};

mainWrapObj.findIntersections = function findIntersections(
  event,
  exeption,
  level
) {
  var selectedLocation = undefined;

  const all_rect_wrap = d3.selectAll(".rect_wrap");

  const all_rect_wrap_node = [];

  function packList(d, i) {
    all_rect_wrap_node.push(this);
  }

  all_rect_wrap.each(packList);

  for (let i = 0; i < all_rect_wrap_node.length; i++) {
    const that = all_rect_wrap_node[i];

    const x = parseFloat(d3.select(that).attr("x"));
    const y = parseFloat(d3.select(that).attr("y"));
    const w = parseFloat(d3.select(that).attr("width"));
    const h = parseFloat(d3.select(that).attr("height"));
    const id = d3.select(that).attr("block_id");
    const l = d3.select(that).attr("level");

    if (exeption.includes(id) == false) {
      if (event.x > x && event.x < x + w) {
        if (event.y > y && event.y < y + h) {
          if (level == undefined) {
            d3.select(that).select("rect").classed("rect_shine", true);
            selectedLocation = that;
            break;
          } else {
            if (Number(level) === Number(l)) {
              d3.select(that).select("rect").classed("rect_shine", true);
              selectedLocation = that;
              break;
            } else {
              selectedLocation = undefined;
            }
          }
        } else {
          selectedLocation = undefined;
        }
      }
    }
  }

  return selectedLocation;
};

mainWrapObj.levelMove = function levelMove(block, shift) {
  var wire_arr = $(block).attr("wireoutarr");

  const it_level = parseInt($(block).attr("level"));
  $(block).attr("level", it_level - shift);

  if (wire_arr != undefined) {
    wire_arr = wire_arr.split(",");

    for (let i = 0; i < wire_arr.length; i++) {
      if (
        wire_arr[i] !== null &&
        wire_arr[i] !== "" &&
        wire_arr[i].replace(/ /gi, "") !== ""
      ) {
        const wire_level = parseInt(
          $(".wire[wire_id=" + wire_arr[i] + "]").attr("level")
        );
        $(".wire[wire_id=" + wire_arr[i] + "]").attr(
          "level",
          wire_level - shift
        );

        const wirein_level = parseInt(
          $(".wirein[wirein_id=" + wire_arr[i] + "]").attr("level")
        );
        $(".wirein[wirein_id=" + wire_arr[i] + "]").attr(
          "level",
          wirein_level - shift
        );

        const block_id = $(".wire[wire_id=" + wire_arr[i] + "]").attr("to_id");

        mainWrapObj.levelMove("svg[block_id=" + block_id + "]", shift);
      }
    }
  }
};

mainWrapObj.prevState = function prevState() {
  var state = mainWrapObj.current_state - 1;
  if (state < 1) {
    state = 0;
  }

  this.current_state = state;
  d3.select(".workspace").html(mainWrapObj.canvas_states[state]);
  this.initCanvas();
  this.highlightUndoBtns();
};

mainWrapObj.nextState = function nextState() {
  var state = mainWrapObj.current_state + 1;
  if (state > mainWrapObj.canvas_states.length - 1) {
    state = mainWrapObj.canvas_states.length - 1;
  }

  this.current_state = state;
  d3.select(".workspace").html(mainWrapObj.canvas_states[state]);
  this.initCanvas();
  this.highlightUndoBtns();
};

mainWrapObj.saveState = function saveState() {
  this.canvas_states.push(d3.select(".workspace").html());

  if (this.canvas_states.length > 50) {
    this.canvas_states = this.canvas_states.filter(function (id) {
      return id > 15;
    });
  }

  this.current_state = this.canvas_states.length - 1;

  this.highlightUndoBtns();
};

mainWrapObj.highlightUndoBtns = function highlightUndoBtns() {
  if (this.current_state == 0) {
    $(".prevBtn").addClass("diactivated");
  } else {
    $(".prevBtn").removeClass("diactivated");
  }

  if (this.current_state == this.canvas_states.length - 1) {
    $(".nextBtn").addClass("diactivated");
  } else {
    $(".nextBtn").removeClass("diactivated");
  }
};

mainWrapObj.selectBlock = function selectBlock(block, noreset) {
  if (noreset !== true) {
    this.resetBlock();
  }
  this.selectObj(1, block);
  $(".btn-new-line").remove();
  $(".btn-cross-line").remove();

  if (d3.select(block).attr("level") === "0") {
    d3.select(block.parentNode)
      .insert("circle")
      .attr("class", "btn-new-line")
      .attr("fill", "gray")
      .attr("r", 6)
      .attr(
        "cx",
        parseFloat(d3.select(block).attr("x")) +
          parseFloat(d3.select(block).attr("width")) / 2
      )
      .attr("cy", parseFloat(d3.select(block).attr("y")) + 20)
      .attr("block_id", d3.select(block).attr("block_id"));
  } else {
    d3.select(block.parentNode)
      .insert("circle")
      .attr("class", "btn-cross-line")
      .attr("fill", "lightgray")
      .attr("stroke", "gray")
      .attr("stroke-width", 2)
      .attr("r", 6)
      .attr(
        "cx",
        parseFloat(d3.select(block).attr("x")) +
          parseFloat(d3.select(block).attr("width")) / 2
      )
      .attr("cy", parseFloat(d3.select(block).attr("y")) + 20)
      .attr("block_id", d3.select(block).attr("block_id"));
  }

  if (d3.select(block).select(".btn-del-wrap").size() === 0) {
    d3.select(block)
      .insert("foreignObject")
      .attr("class", "btn-del-wrap")
      .attr("width", "20")
      .attr("height", "20")
      .attr("x", 4)
      .attr("y", 8)
      .html('<img src="img/delete.svg" class="btn-del"/>');
  }

  if (d3.select(block).select(".btn-plus-wrap").size() === 0) {
    d3.select(block)
      .insert("foreignObject")
      .attr("class", "btn-plus-wrap")
      .attr("width", "20")
      .attr("height", "20")
      .attr("x", parseFloat(d3.select(block).attr("width")) - 20)
      .attr("y", 8)
      .html('<img src="img/plus.svg" class="btn-plus"/>');
  } else {
    d3.select(block)
      .select(".btn-plus-wrap")
      .attr("x", parseFloat(d3.select(block).attr("width")) - 20);
  }

  if (d3.select(block).select(".btn-note-wrap").size() === 0) {
    d3.select(block)
      .insert("foreignObject")
      .attr("class", "btn-note-wrap")
      .attr("block_id", d3.select(block).attr("block_id"))
      .attr("width", "20")
      .attr("height", "20")
      .attr("x", parseFloat(d3.select(block).attr("width")) - 20)
      .attr("y", parseFloat(d3.select(block).attr("height")) - 22)
      .html('<span class="note_sign">N</span>');
  } else {
    d3.select(block)
      .select(".btn-note-wrap")
      .attr("x", parseFloat(d3.select(block).attr("width")) - 20);
  }

  if (d3.select(block).select(".btn-arrow-wrap").size() === 0) {
    if (d3.select(block).attr("wireoutarr") !== "") {
      d3.select(block)
        .insert("foreignObject")
        .attr("class", "btn-arrow-wrap")
        .attr("width", "20")
        .attr("height", "20")
        .attr("x", 4)
        .attr("y", 64)
        .html(
          '<img src="img/arrow.svg" hide_state="false" class="btn-arrow"/>'
        );
    }
  } else {
    if (d3.select(block).attr("wireoutarr") === "") {
      d3.select(block).select(".btn-arrow-wrap").remove();
    }
  }

  $(block).find(".btn-del-wrap").show();
  $(block).find(".btn-arrow-wrap").show();
  $(block).find(".btn-plus-wrap").show();
  $(block).find(".btn-note-wrap").show();

  svg.selectAll(".btn-del-wrap").on("click", function (event) {
    event.stopPropagation();
    mainWrapObj.saveState();
    mainWrapObj.removeBlock($(this).parent());
  });

  svg.selectAll(".btn-del-wrap").on("mousedown", function (event) {
    event.stopPropagation();
  });

  svg.selectAll(".btn-plus-wrap").on("mousedown", function (event) {
    event.stopPropagation();
  });

  svg.selectAll(".btn-plus-wrap").on("click", function (event) {
    event.stopPropagation();
    mainWrapObj.saveState();
    mainWrapObj.childToSelected(event);
  });

  svg.selectAll(".btn-note-wrap").on("mousedown", function (event) {
    event.stopPropagation();
  });

  svg.selectAll(".btn-note-wrap").on("click", function (event) {
    event.stopPropagation();
    const block = $(".rect_wrap[block_id=" + $(this).attr("block_id") + "]")[0];
    mainWrapObj.selectObj(4, block);
    mainWrapObj.modalShow();
  });

  svg.selectAll(".btn-arrow-wrap").on("click", function (event) {
    event.stopPropagation();
    if ($(this).find(".btn-arrow").attr("hide_state") === "false") {
      mainWrapObj.hideChildren($(this).parent(), $(this));
    } else {
      mainWrapObj.showChildren($(this).parent(), $(this));
    }
  });

  svg.selectAll(".btn-arrow-wrap").on("mousedown", function (event) {
    event.stopPropagation();
  });

  var selectedLocation;

  const obj = {
    exeption: [],
  };

  this.getAllChildren(d3.select(block).attr("block_id"), obj.exeption);

  const exeption = obj.exeption;
  exeption.push(d3.select(block).attr("block_id"));

  const dragHandler = d3
    .drag()
    .on("drag", function (event) {
      svg.selectAll("rect").classed("rect_shine", false);
      clearTimeout(mainWrapObj.clearSelected);

      $(".guide_line_2").remove();

      var from = $(
        ".rect_wrap[block_id=" + d3.select(this).attr("block_id") + "]"
      );

      var start_x =
        parseFloat(from.attr("x")) + parseFloat(from.attr("width")) / 2;
      var start_y =
        parseFloat(from.attr("y")) + parseFloat(from.attr("height")) / 2;

      const points = [
        [start_x, start_y],
        [event.x, event.y],
      ];

      const Gen = d3.line().curve(d3.curveLinear);

      const pathOfLine = Gen(points);

      svg
        .append("path")
        .attr("class", "guide_line_2")
        .attr("d", pathOfLine)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", "5");

      d3.select(".btn-new-line").attr("cx", event.x);
      d3.select(".btn-new-line").attr("cy", event.y);

      selectedLocation = mainWrapObj.findIntersections(event, exeption);
    })
    .on("end", function (event) {
      $(".guide_line_2").remove();
      $(".btn-new-line").remove();
      $(".btn-cross-line").remove();
      d3.selectAll(".rect_wrap").select("rect").classed("rect_shine", false);

      mainWrapObj.saveState();

      mainWrapObj.showChildren(
        selectedLocation,
        $(selectedLocation).find(".btn-arrow-wrap")
      );

      const block = $(
        ".rect_wrap[block_id=" + d3.select(this).attr("block_id") + "]"
      )[0];
      const block_id = d3.select(block).attr("block_id");
      const block_level = d3.select(block).attr("level");

      const start_x = parseFloat(d3.select(block).attr("x"));
      const start_y = parseFloat(d3.select(block).attr("y"));

      const to = [start_x, start_y];

      if (selectedLocation != undefined) {
        const from = [
          parseFloat(d3.select(selectedLocation).attr("x")),
          parseFloat(d3.select(selectedLocation).attr("y")),
        ];

        const level_diff =
          Number(block_level) -
          (Number(d3.select(selectedLocation).attr("level")) + 1);

        mainWrapObj.line_id++;

        mainWrapObj.drawWire(
          from,
          to,
          mainWrapObj.line_id,
          d3.select(selectedLocation).attr("block_id"),
          block_id,
          selectedLocation,
          Number(d3.select(selectedLocation).attr("level")) + 1
        );

        var locationWirePack = d3.select(selectedLocation).attr("wireoutarr");

        if (locationWirePack !== "" && locationWirePack != undefined) {
          locationWirePack = locationWirePack.split(",");
        } else {
          locationWirePack = [];
        }

        locationWirePack.push(mainWrapObj.line_id);
        d3.select(selectedLocation).attr(
          "wireoutarr",
          locationWirePack.join(",")
        );

        d3.select(block).attr("line_in", mainWrapObj.line_id);

        mainWrapObj.levelMove(block, level_diff);
      }
      mainWrapObj.saveState();
    });

  dragHandler(svg.selectAll(".btn-new-line"));

  const dragHandlerCross = d3
    .drag()
    .on("drag", function (event) {
      svg.selectAll("rect").classed("rect_shine", false);
      clearTimeout(mainWrapObj.clearSelected);

      $(".guide_line_2").remove();

      const from = $(
        ".rect_wrap[block_id=" + d3.select(this).attr("block_id") + "]"
      );

      const start_x =
        parseFloat(from.attr("x")) + parseFloat(from.attr("width")) / 2;
      const start_y =
        parseFloat(from.attr("y")) + parseFloat(from.attr("height")) / 2;

      const points = [
        [start_x, start_y],
        [event.x, event.y],
      ];

      const Gen = d3.line().curve(d3.curveLinear);

      const pathOfLine = Gen(points);

      svg
        .append("path")
        .attr("class", "guide_line_2")
        .attr("d", pathOfLine)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", "5");

      d3.select(".btn-cross-line").attr("cx", event.x);
      d3.select(".btn-cross-line").attr("cy", event.y);

      selectedLocation = mainWrapObj.findIntersections(event, [
        d3.select(this).attr("block_id"),
      ]);
    })
    .on("end", function (event) {
      $(".guide_line_2").remove();
      $(".btn-new-line").remove();
      $(".btn-cross-line").remove();
      d3.selectAll(".rect_wrap").select("rect").classed("rect_shine", false);

      mainWrapObj.saveState();

      mainWrapObj.showChildren(
        selectedLocation,
        $(selectedLocation).find(".btn-arrow-wrap")
      );

      const block = $(
        ".rect_wrap[block_id=" + d3.select(this).attr("block_id") + "]"
      )[0];
      const block_id = d3.select(this).attr("block_id");

      const start_x = parseFloat(d3.select(block).attr("x"));
      const start_y = parseFloat(d3.select(block).attr("y"));

      const from = [start_x, start_y];

      if (selectedLocation != undefined) {
        const to = [
          parseFloat(d3.select(selectedLocation).attr("x")),
          parseFloat(d3.select(selectedLocation).attr("y")),
        ];

        mainWrapObj.line_id++;

        mainWrapObj.drawCrossWire(
          from,
          to,
          mainWrapObj.line_id,
          block_id,
          d3.select(selectedLocation).attr("block_id"),
          block,
          Number(d3.select(selectedLocation).attr("level")) + 1
        );

        var locationWirePack = d3
          .select(selectedLocation)
          .attr("crosswireinarr");

        if (locationWirePack !== "" && locationWirePack != undefined) {
          locationWirePack = locationWirePack.split(",");
        } else {
          locationWirePack = [];
        }

        locationWirePack.push(mainWrapObj.line_id);
        d3.select(selectedLocation).attr(
          "crosswireinarr",
          locationWirePack.join(",")
        );

        var locationWirePack2 = d3.select(block).attr("crosswireoutarr");

        if (locationWirePack2 !== "" && locationWirePack2 != undefined) {
          locationWirePack2 = locationWirePack2.split(",");
        } else {
          locationWirePack2 = [];
        }

        locationWirePack2.push(mainWrapObj.line_id);
        d3.select(block).attr("crosswireoutarr", locationWirePack2.join(","));
      }
      mainWrapObj.saveState();
    });

  dragHandlerCross(svg.selectAll(".btn-cross-line"));
};

mainWrapObj.deleteSelected = function deleteSelected() {
  this.removeBlock(mainWrapObj.selectedRect);
};

mainWrapObj.childToSelected = function childToSelected(e) {
  mainWrapObj.addBlock(e);
};

mainWrapObj.rollSelected = function rollSelected() {
  const btn_wrap = $(mainWrapObj.selectedRect).find(".btn-arrow-wrap");
  const btn = $(mainWrapObj.selectedRect).find(".btn-arrow");

  if (btn.attr("hide_state") === "false") {
    this.hideChildren(this.selectedRect, btn_wrap);
  } else {
    this.showChildren(this.selectedRect, btn_wrap);
  }
};

mainWrapObj.removeWire = function removeWire(del_id) {
  this.saveState();
  const wire = $(".wire[wire_id=" + del_id + "]");
  const wire_in = $(".wirein[wirein_id=" + del_id + "]");
  const from_id = wire.attr("from_id");
  const to_id = wire.attr("to_id");
  const from = $("svg[block_id=" + from_id + "]");
  const to = $("svg[block_id=" + to_id + "]");
  const to_level = parseInt(to.attr("level"));

  to.attr("line_in", "");

  wire_in.remove();
  wire.remove();

  var from_wireoutarr = from.attr("wireoutarr");

  from_wireoutarr = from_wireoutarr.split(",");

  var from_wireoutarr_new = from_wireoutarr.filter((id) => id != del_id);

  from_wireoutarr_new = from_wireoutarr_new.join(",");

  from.attr("wireoutarr", from_wireoutarr_new);

  this.levelMove($(to), to_level);
  this.resetBlock();
  this.saveState();
};

mainWrapObj.removeCrossWire = function removeCrossWire(del_id) {
  this.saveState();
  const wire = $(".cross_wire[wire_id=" + del_id + "]");
  const wire_in = $(".cross_wirein[wirein_id=" + del_id + "]");
  const from_id = wire.attr("from_id");
  const to_id = wire.attr("to_id");
  const from = $("svg[block_id=" + from_id + "]");
  const to = $("svg[block_id=" + to_id + "]");

  wire_in.remove();
  wire.remove();

  var from_wireoutarr = from.attr("crosswireoutarr");

  from_wireoutarr = from_wireoutarr.split(",");

  var from_wireoutarr_new = from_wireoutarr.filter((id) => id != del_id);

  from_wireoutarr_new = from_wireoutarr_new.join(",");

  from.attr("crosswireoutarr", from_wireoutarr_new);

  var to_wireinarr = to.attr("crosswireinarr");

  to_wireinarr = to_wireinarr.split(",");

  var to_wireinarr_new = to_wireinarr.filter((id) => id != del_id);

  to_wireinarr_new = to_wireinarr_new.join(",");

  to.attr("crosswireinarr", to_wireinarr_new);
  this.resetBlock();
  this.saveState();
};

mainWrapObj.defaultBend = function defaultBend(id) {
  $(id).attr("changed", false);
  this.redrawLines([$(id).attr("wire_id")]);
  this.resetBlock();
};

mainWrapObj.defaultCrossLineBend = function defaultBend(id) {
  $(id).attr("changed", false);
  this.redrawCrossLines([$(id).attr("wire_id")]);
  this.resetBlock();
};

mainWrapObj.addNotePoint = function addNotePoint() {
  const wrap_pos = $(".workspace")[0].getBoundingClientRect();

  const correct_x =
    mainWrapObj.clickPos[0] / mainWrapObj.canvasZoom -
    wrap_pos.x / mainWrapObj.canvasZoom;
  const correct_y =
    mainWrapObj.clickPos[1] / mainWrapObj.canvasZoom -
    wrap_pos.y / mainWrapObj.canvasZoom;
  mainWrapObj.note_id++;
  svg
    .append("svg")
    .append("foreignObject")
    .attr("class", "notepoint_wrap")
    .attr("width", "24")
    .attr("height", "24")
    .attr("x", correct_x)
    .attr("y", correct_y)
    .attr("note_id", mainWrapObj.note_id)
    .html("N");
  $(".main_contextmenu_wrap").hide();
  mainWrapObj.initNotes();
};

mainWrapObj.removeNotePoint = function removeNotePoint() {
  this.saveState();

  const index = d3.select(mainWrapObj.selectedNote).attr("note_id");

  $(".point_note[index=" + index + "]").remove();

  d3.select(mainWrapObj.selectedNote).remove();

  this.selectObj(0);
  $(".note_contextmenu_wrap").hide();
};

mainWrapObj.canvasToCenter = function canvasToCenter() {
  $(".workspace_wrap").scrollLeft(
    $(".workspace_wrap").outerWidth() + $(".workspace_wrap").offset().left
  );
  $(".workspace_wrap").scrollTop(
    $(".workspace_wrap").outerHeight() + $(".workspace_wrap").offset().top
  );
  this.resetBlock();
};

mainWrapObj.zoomCanvas = function zoomCanvas() {
  var zoom_val = parseFloat($("#canvas_zoom").val());

  if (zoom_val > 200) {
    zoom_val = 200;
  }

  if (zoom_val < 20) {
    zoom_val = 20;
  }

  $("#canvas_zoom").val(zoom_val);

  zoom_val = zoom_val / 100;

  $(".workspace").css("transform", "scale(" + zoom_val + ")");
  mainWrapObj.canvasZoom = zoom_val;

  $(".zoom_wrap").width(
    parseFloat($(".workspace")[0].getBoundingClientRect().width)
  );
  $(".zoom_wrap").height(
    parseFloat($(".workspace")[0].getBoundingClientRect().height)
  );

  $(".zoom_wrap").css(
    "margin-top",
    (parseFloat($(".workspace_wrap").height()) -
      parseFloat($(".zoom_wrap").height())) /
      2
  );
  $(".zoom_wrap").css(
    "margin-left",
    (parseFloat($(".workspace_wrap").width()) -
      parseFloat($(".zoom_wrap").width())) /
      2
  );
};

mainWrapObj.modalShow = function modalShow() {
  if (mainWrapObj.selectedNote != undefined) {
    if (d3.select(mainWrapObj.selectedNote).attr("note_id") != undefined) {
      const index = d3.select(mainWrapObj.selectedNote).attr("note_id");

      if ($(".point_note[index=" + index + "]").length > 0) {
        $(".mindmap_modal .note_text").val(
          $(".point_note[index=" + index + "]").text()
        );
      } else {
        $(".mindmap_modal .note_text").val("");
      }
    } else {
      const index = d3.select(mainWrapObj.selectedNote).attr("block_id");

      if ($(".simple_note[index=" + index + "]").length > 0) {
        $(".mindmap_modal .note_text").val(
          $(".simple_note[index=" + index + "]").text()
        );
      } else {
        $(".mindmap_modal .note_text").val("");
      }
    }
    $(".mindmap_modal").fadeIn(200);
  }
};

mainWrapObj.saveNote = function saveNote() {
  if (this.selectedNote != undefined) {
    const note_text = $(".mindmap_modal .note_text")
      .val()
      .replace(/<[^>]*>/gi, "");
    if (d3.select(this.selectedNote).attr("note_id") != undefined) {
      const index = d3.select(this.selectedNote).attr("note_id");

      if ($(".point_note[index=" + index + "]").length > 0) {
        $(".point_note[index=" + index + "]").text(note_text);
      } else {
        svg
          .append("text")
          .attr("class", "point_note")
          .attr("index", index)
          .attr("visibility", "hidden")
          .text(note_text);
      }
      if (note_text.length > 0) {
        $(this.selectedNote).addClass("noteActive");
      } else {
        $(this.selectedNote).removeClass("noteActive");
      }
    } else {
      const index = d3.select(this.selectedNote).attr("block_id");

      if ($(".simple_note[index=" + index + "]").length > 0) {
        $(".simple_note[index=" + index + "]").text(
          $(".mindmap_modal .note_text")
            .val()
            .replace(/<[^>]*>/gi, "")
        );
      } else {
        svg
          .append("text")
          .attr("class", "simple_note")
          .attr("index", index)
          .attr("visibility", "hidden")
          .text(
            $(".mindmap_modal .note_text")
              .val()
              .replace(/<[^>]*>/gi, "")
          );
      }

      if (note_text.length > 0) {
        $(".btn-note-wrap[block_id=" + index + "] .note_sign").addClass(
          "noteActive"
        );
      } else {
        $(".btn-note-wrap[block_id=" + index + "] .note_sign").removeClass(
          "noteActive"
        );
      }
    }
    this.selectObj(0);
    $(".mindmap_modal").fadeOut(200);
  }
  this.saveState();
};

mainWrapObj.initCanvasMoving = function initCanvasMoving() {
  const ele = document.getElementsByClassName("workspace_wrap")[0];
  ele.style.cursor = "grab";

  let pos = { top: 0, left: 0, x: 0, y: 0 };

  const mouseDownHandler = function (e) {
    ele.style.cursor = "grabbing";
    ele.style.userSelect = "none";

    pos = {
      left: ele.scrollLeft,
      top: ele.scrollTop,
      // Get the current mouse position
      x: e.clientX,
      y: e.clientY,
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;

    // Scroll the element
    ele.scrollTop = pos.top - dy;
    ele.scrollLeft = pos.left - dx;
  };

  const mouseUpHandler = function () {
    ele.style.cursor = "grab";
    ele.style.removeProperty("user-select");

    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
  };

  // Attach the handler
  ele.addEventListener("mousedown", mouseDownHandler);
};

mainWrapObj.inputUpdate = function inputUpdate(e) {
  const that = $(this).parent().parent().parent()[0];

  clearTimeout(mainWrapObj.clearSelected);

  $(".width_text").remove();

  svg
    .append("text")
    .attr("dy", "1rem")
    .attr("class", "width_text")
    .attr("font-family", $(this).css("font-family"))
    .attr("font-style", $(this).css("font-style"))
    .attr("font-size", $(this).css("font-size"))
    .attr("font-weight", $(this).css("font-weight"))
    .attr("visibility", "hidden")
    .text($(this).val());

  const padding = 20;

  if ($(this).val().length >= 3) {
    $(this).attr("size", $(this).val().length);
    $(this).css("width", $(".width_text")[0].getBBox().width + padding);
  }

  if ($(this).val().length === 0) {
    $(this).attr("size", 3);
    $(this).css("width", "auto");
  }

  $(this).attr("value", $(this).val());

  mainWrapObj.rectWidth(this, that);

  var lines = d3.select(that).attr("wireoutarr");
  if (lines != null && lines != undefined) {
    lines = lines.split(",");
    lines.push(d3.select(that).attr("line_in"));
  }

  var cross_lines_out = d3.select(that).attr("crosswireoutarr");
  if (cross_lines_out != null && cross_lines_out != undefined) {
    cross_lines_out = cross_lines_out.split(",");
  }

  var cross_lines_in = d3.select(that).attr("crosswireinarr");
  if (cross_lines_in != null && cross_lines_in != undefined) {
    cross_lines_in = cross_lines_in.split(",");
  }

  mainWrapObj.redrawLines(lines);
  mainWrapObj.redrawCrossLines(cross_lines_out);
  mainWrapObj.redrawCrossLines(cross_lines_in);
  mainWrapObj.selectBlock(that, true);
};

mainWrapObj.mouseClick = function mouseClick(e) {
  e.stopPropagation();

  mainWrapObj.clearEmpty();

  clearTimeout(mainWrapObj.clearSelected);
  mainWrapObj.clearSelected = setTimeout(function () {
    mainWrapObj.resetBlock();
  }, 500);
  $(".input-wrap input").prop("readonly", true);
};

mainWrapObj.mouseDblClick = function mouseDblClick(e) {
  e.stopPropagation();
  if (mainWrapObj.selectedRect != undefined) {
    mainWrapObj.addBlock(e);
  }
};

const svg = d3.select(".workspace");

svg
  .on("click", mainWrapObj.mouseClick)
  .on("dblclick", mainWrapObj.mouseDblClick);

mainWrapObj.initCanvas();
mainWrapObj.canvasToCenter();
mainWrapObj.initCanvasMoving();

$(".workspace_wrap").on("wheel", function () {
  if (event.deltaY > 0) {
    $("#canvas_zoom").val(parseFloat($("#canvas_zoom").val()) - 1);
  } else {
    $("#canvas_zoom").val(parseFloat($("#canvas_zoom").val()) + 1);
  }

  mainWrapObj.zoomCanvas();
});
$(".rect_theme").on("change", function () {
  $(".rect_wrap").attr("theme", $(this).val());
  mainWrapObj.theme = $(this).val();
});

$("html").keyup(function (e) {
  if (e.keyCode == 46) {
    if (mainWrapObj.selectedRect != undefined) {
      mainWrapObj.saveState();
      mainWrapObj.removeBlock($(mainWrapObj.selectedRect));
    }
    if (mainWrapObj.selectedLine != undefined) {
      mainWrapObj.saveState();
      mainWrapObj.removeWire($(mainWrapObj.selectedLine).attr("wire_id"));
    }
    if (mainWrapObj.selectedCrossLine != undefined) {
      mainWrapObj.saveState();
      mainWrapObj.removeCrossWire(
        $(mainWrapObj.selectedCrossLine).attr("wire_id")
      );
    }
    if (mainWrapObj.selectedNote != undefined) {
      if (d3.select(mainWrapObj.selectedNote).attr("note_id") != undefined) {
        mainWrapObj.saveState();
        mainWrapObj.removeNotePoint();
      }
    }
  }
});
$(".icon_common").on("click", function () {
  d3.select(mainWrapObj.selectedRect)
    .select(".rect_image")
    .html("<img src='" + $(this).attr("src") + "' class='rect_icon'/>");
});

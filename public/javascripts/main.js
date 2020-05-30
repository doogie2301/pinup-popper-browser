$(document).ready(function () {
  lazyload();

  $('[data-toggle="tooltip"]').tooltip();

  $("#tabs li:eq(0) a").tab("show");

  $("img.wheel").on("error", function () {
    $(this).removeClass(function (index, css) {
      return (css.match(/(^|\s)rotate\S+/g) || []).join(" ");
    });
    $(this).attr("src", "/images/unavailable.png");
  });

  if (
    $(location)
      .attr("href")
      .substring($(location).attr("href").lastIndexOf("/") + 1) === "current"
  ) {
    let refresh = $("#game").data("refresh");
    if (refresh) {
      window.setInterval("location.reload();", $("#game").data("refresh"));
    }
  }

  $('a[data-toggle="tab"]').on("show.bs.tab", function (e) {
    let target;
    if (e.target.text === "Info") {
      target = "info";
    } else if (e.target.text === "Help") {
      target = "help";
    } else if (e.target.text === "Playfield") {
      target = "playfield";
    }

    if (target) {
      if (target == "playfield") {
        if ($("#playfield").children().length) {
          return;
        }

        fetch($("#game").data("gameid") + "/" + target)
          .then((response) => {
            return response.status == 200 ? response.json() : [];
          })
          .then((data) => {
            if (data.length) {
              let rotate = $("#playfield").data("rotate") != undefined;
              let src = data[0];
              var elem;
              if (src.endsWith(".png") || src.endsWith(".jpg")) {
                elem = $("<img />", {
                  class: rotate ? "playfieldRotate" : "playfield",
                  src: src,
                });
              } else {
                elem = $("<video />", {
                  id: "vidPlayfield",
                  class: rotate ? "playfieldRotate" : "playfield",
                  src: data[0],
                  type: "video/mp4",
                  playsinline: true,
                  autoplay: true,
                  loop: true,
                });
              }
            } else {
              elem = $('<img src="/images/unavailable.png" />');
            }
            elem.appendTo($("#playfield"));
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        if (
          $("#carousel" + e.target.text + " .carousel-inner").children().length
        ) {
          return;
        }

        fetch($("#game").data("gameid") + "/" + target)
          .then((response) => {
            return response.status == 200 ? response.json() : [];
          })
          .then((data) => {
            if (!data.length) {
              data.push("/images/unavailable.png");
            }
            let i = 0;
            $.each(data, function (index, value) {
              $(
                '<div class="carousel-item"><img ' +
                  (i == 0 ? "" : "data-") +
                  'src="' +
                  value +
                  '"></div>'
              ).appendTo("#carousel" + e.target.text + " .carousel-inner");
              i++;
            });
            $("#carousel" + e.target.text).carousel("pause");
            if (i == 1) {
              $("#carousel" + e.target.text + " a").remove();
            }
            $("#carousel" + e.target.text + " .carousel-item")
              .first()
              .addClass("active");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  });

  $(".carousel").on("slide.bs.carousel", function (e) {
    var $upcomingImage = $(e.relatedTarget).find("img");
    if (typeof $upcomingImage.attr("src") === "undefined") {
      $upcomingImage.attr("src", $upcomingImage.data("src"));
    }
  });

  $(document).on("click", ".navbar-collapse.show", function (e) {
    if ($(e.target).is('a:not(".dropdown-toggle"), img')) {
      $(this).collapse("hide");
    }
  });

  $("#btnBack").on("click", function () {
    history.back();
  });

  $("#btnLaunch").on("click", function () {
    var spinner = $(
      '<span class="spinner-border spinner-border-sm ml-1" role="status" aria-hidden="true"></span>'
    );
    $(this).append(spinner);
    fetch("/games/" + $(this).data("id") + "/launch")
      .then((response) => {
        response.status != 200
          ? showAlert(danger, "Launch request failed")
          : showAlert("success", "Launch request succeeded");
      })
      .catch(() => {
        showAlert("danger", "Launch request failed");
      })
      .finally(() => {
        spinner.remove();
      });
  });

  $("#btnExit").on("click", function () {
    var spinner = $(
      '<span class="spinner-border spinner-border-sm ml-1" role="status" aria-hidden="true"></span>'
    );
    $(this).append(spinner);
    fetch("/games/exit")
      .then((response) => {
        response.status != 200
          ? showAlert(danger, "Exit request failed")
          : showAlert("success", "Exit request succeeded");
      })
      .catch(() => {
        showAlert("danger", "Exit request failed");
      })
      .finally(() => {
        spinner.remove();
      });
  });

  function showAlert(type, text) {
    $(
      '<div class="alert alert-' +
        type +
        ' role="alert">' +
        text +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</button></div>'
    )
      .hide()
      .appendTo("#response")
      .fadeIn(1000);

    $(".alert")
      .delay(3000)
      .fadeOut("normal", function () {
        $(this).remove();
      });
  }

  $("[data-filter]").on("click", function () {
    var type = $(this).data("filter");
    var value = type === "fav" ? "1" : $(this).text();
    filter(type, value);
  });

  function filter(type, value) {
    $("#gamesRow div").filter(function () {
      $(this).toggle($(this).data(type) == value);
    });
    updateGameCount();
    localStorage.setItem("filterType", type);
    localStorage.setItem("filterValue", value);
    $("#gameSearch").val("");
  }

  if ($("[data-filter]").length > 0 && localStorage.getItem("filterType")) {
    var type = localStorage.getItem("filterType");
    var value = localStorage.getItem("filterValue");
    filter(type, value);
  }

  $("#clearFilter").on("click", function () {
    $("#gameSearch").val("");
    search($("#gameSearch"));
    $(this).toggle();
  });

  function checkFilter() {
    var gameCount = $("#gameCount");
    $("#clearFilter").toggle(gameCount.data("total") != gameCount.text());
  }

  var observer = new MutationObserver(function (e) {
    checkFilter();
  });

  if ($("#gameCount").length > 0) {
    observer.observe($("#gameCount")[0], {
      characterData: true,
      childList: true,
    });
  }

  function updateGameCount() {
    var cnt = $(".game:visible").length;
    $("#gameCount").text(cnt);
  }

  function delay(callback, ms) {
    var timer = 0;
    return function () {
      var context = this,
        args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        callback.apply(context, args);
      }, ms || 0);
    };
  }

  $("form input").keydown(function (e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      return false;
    }
  });

  function search(searchbox) {
    var value = searchbox.val().toLowerCase();
    $("#gamesRow div").filter(function () {
      $(this).toggle(
        $("a", this).attr("data-original-title").toLowerCase().indexOf(value) >
          -1
      );
    });
    updateGameCount();
    localStorage.removeItem("filterType");
    localStorage.removeItem("filterValue");
  }

  $("#gameSearch").on("search", function () {
    search($(this));
  });

  $("#gameSearch").on(
    "keyup",
    delay(function () {
      search($(this));
    }, 400)
  );

  if ($("#gameSearch").val()) {
    search($("#gameSearch"));
  }
  checkFilter();

  $("#randomSelect").on("click", function () {
    var games = $(".game:visible");
    var random = Math.floor(Math.random() * games.length);
    games.eq(random).find("a")[0].click();
  });
});

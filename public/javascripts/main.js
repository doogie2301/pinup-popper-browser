$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    $("#tabs li:eq(0) a").tab('show');

    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
        let target;
        if (e.target.text === "Info") {
            target = 'info';
        } else if (e.target.text === 'Help') {
            target = 'help';
        } else if (e.target.text === 'Playfield') {
            target = 'playfield';
        }

        if (target)
        {
            if (target == "playfield") {
                if ($("#vidPlayfield").length) {
                    return;
                }

                fetch(e.target.getAttribute("data-gameid") + '/' + target)
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        if (data.length) {
                            var video = $('<video />', {
                                id: 'vidPlayfield',
                                src: data[0],
                                type: 'video/mp4',
                                autoplay: true,
                                loop: true
                            });
                            video.appendTo($('#playfield'));
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
            else {
                if ($('#carousel' + e.target.text + ' .carousel-inner').children().length) {
                    return;
                }

                fetch(e.target.getAttribute("data-gameid") + '/' + target)
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        $.each(data, function (index, value) {
                            $('<div class="carousel-item"><img src="' + value + '"></div>').appendTo('#carousel' + e.target.text + ' .carousel-inner');
                        });
                        $('#carousel' + e.target.text).carousel('pause');
                        if (data.length == 1) {
                            $('#carousel' + e.target.text + ' a').remove();
                        }
                        $('#carousel' + e.target.text + ' .carousel-item').first().addClass('active');
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        }
    })

    $(document).on('click', '.navbar-collapse.show', function (e) {
        if ($(e.target).is('a:not(".dropdown-toggle")')) {
            $(this).collapse('hide');
        }
    });

    $("#btnBack").on('click', function () {
        history.back();
    });

    $("#btnLaunch").on("click", function () {
        var spinner = $('<span class="spinner-border spinner-border-sm ml-1" role="status" aria-hidden="true"></span>');
        $(this).append(spinner);
        fetch('/games/' + $(this).data("id") + '/launch')
            .then((response) => {
                response.status != 200 ? showAlert(danger, 'Launch request failed')
                    : showAlert('success', 'Launch request succeeded');
            })
            .catch(() => {
                showAlert('danger', 'Launch request failed');
            })
            .finally(() => {
                spinner.remove();
            });
    });

    $("#btnExit").on("click", function () {
        var spinner = $('<span class="spinner-border spinner-border-sm ml-1" role="status" aria-hidden="true"></span>');
        $(this).append(spinner);
        fetch('/games/exit')
            .then((response) => {
                response.status != 200 ? showAlert(danger, 'Exit request failed')
                    : showAlert('success', 'Exit request succeeded');
            })
            .catch(() => {
                showAlert('danger', 'Exit request failed');
            })
            .finally(() => {
                spinner.remove();
            });
    });

    function showAlert(type, text) {
        $('<div class="alert alert-' + type + ' role="alert">' + text +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</button></div>').hide().appendTo('#response').fadeIn(1000);

        $(".alert").delay(3000).fadeOut("normal", function () {
                $(this).remove();
            });
    }

    $("[data-filter]").on("click", function () {
        var type = $(this).data("filter");
        var value = (type === "fav") ? "1" : $(this).text();
        $("#gamesRow div").filter(function () {
            $(this).toggle($(this).data(type) == value)
        });
        updateGameCount();
    });

    function updateGameCount() {
        var cnt = $(".game:visible").length;
        $("#gameCnt").text(cnt);
    }

    $("#gameSearch").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#gamesRow div").filter(function () {
            $(this).toggle($("a", this).attr("data-original-title").toLowerCase().indexOf(value) > -1)
        });
        updateGameCount();
    });

    $("#randomSelect").on("click", function () {
        var games = $(".game:visible");
        var random = Math.floor(Math.random() * games.length);
        games.eq(random).find('a')[0].click();
    });

});
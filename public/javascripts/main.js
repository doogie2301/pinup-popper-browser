$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    $("#tabs li:eq(0) a").tab('show');

    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
        let target;
        if (e.target.text === "Info") {
            target = 'info';
        } else if (e.target.text === 'Help') {
            target = 'help';
        }

        if (target)
        {
            fetch(e.target.getAttribute("data-gameid") + '/' + target)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    console.log(data);
                    $.each(data, function (index, value) {
                        $('<div class="carousel-item"><img src="' + value + '"></div>').appendTo('#carousel' + e.target.text + ' .carousel-inner');
                    });
                    $('#carousel' + e.target.text).carousel('pause');
                    if (data.length == 1) {
                        console.log('remove');
                        $('#carousel' + e.target.text + ' a').remove();
                    }
                    $('#carousel' + e.target.text + ' .carousel-item').first().addClass('active');
                })
                .catch(err => {
                    console.log(err);
                });
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
        fetch('/games/' + $(this).data("id") + '/launch')
            .then((response) => {
                response.status != 200 ? showAlert(danger, 'Failed to launch game')
                    : showAlert('success', 'Successfully launched game');
            })
            .catch(() => {
                showAlert('danger', 'Failed to launch game');
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
        var value = $(this).text();
        $("#gamesRow div").filter(function () {
            $(this).toggle($(this).data(type) == value)
        });
    });

    $("#gameSearch").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#gamesRow div").filter(function () {
            $(this).toggle($("a", this).attr("title").toLowerCase().indexOf(value) > -1)
        });
    });
});
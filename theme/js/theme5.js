(function($) {
    "use strict";
    $(document).ready(function() {
        // Activate tooltips
        $('[data-bs-toggle="tooltip"]').tooltip({container: 'body'});

        // Add nested dropdown menus
        $('ul.dropdown-menu [data-bs-toggle=dropdown]').on('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            $(this).parent().addClass('open');
            $(this).parent().find("ul").parent().find("li.dropdown").addClass('open');
        });
    });
})(jQuery);



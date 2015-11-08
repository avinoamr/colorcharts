(function () {
    window.color = function color( element ) {
        return {
            bar: function () {
                return color.bar( element )
            },
            line: function () {
                return color.line( element );
            }
        }
    }
})();

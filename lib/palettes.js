(function () {
    var color = window.color;
    var getset = color.getset;

    color.palettes = {

        // 
        "paired": [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928" ],
        "default": [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f" ],
        
        "greens": { from: "#c7e9c0", to: "#00441b" }
    }

    color.palette = function () {
        var options = {
            domain: null,
            colors: null
        }

        function palette() {}
        palette.colors = getset( options, "colors" );
        palette.domain = getset( options, "domain" );
        palette.scale = function () {
            var clin = d3.scale.linear()
                .domain( d3.extent( options.domain ) )
                .range( [ options.colors.from, options.colors.to ] );

            var cord = d3.scale.ordinal()
                .domain( options.domain )
                .range( options.colors );

            return options.colors.from && options.colors.to ? clin : cord;
        }

        return palette
    }

})();

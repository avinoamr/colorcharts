(function () {
    var color = window.color;
    var getset = color.getset;

    color.palettes = {

        // discrete
        // red, green, blue, purple, yellow, brown
        "default": [ "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f" ],
        "material": [ "#D81B60", "#43A047", "#1E88E5", "#5E35B1", "#FDD835", "#E53935", "#8E24AA", "#3949AB", "#039BE5", "#00ACC1", "#00897B", "#7CB342", "#C0CA33", "#FB8C00", "#6D4C41" ],
        "paired": [ "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928" ],
        "pastel": [ "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2" ],

        // ranges
        "greyscale": { from: "#424242", to: "#BDBDBD" },
        "reds": { from: "#fcbba1", to: "#67000d" },
        "greens": { from: "#c7e9c0", to: "#00441b" },
        "blues": { from: "#c6dbef", to: "#08306b" },
        "purples": { from: "#dadaeb", to: "#3f007d" },
        "oranges": { from: "#fdd0a2", to: "#7f2704" },
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
            var colors = options.colors;

            if ( typeof colors == "string" ) {
                colors = color.palettes[ colors ];
            }

            var domain = options.domain;

            // linear
            var isRange = !Array.isArray( colors ) && colors.from && colors.to;
            var isNumeric = domain.every( function ( d ) {
                return !isNaN( +d );
            });

            // impossible to draw as a range, turn it into a discrete set
            if ( isRange && !isNumeric ) {
                isRange = false;
                var interp = d3.interpolate( colors.from, colors.to );
                colors = domain.map( function ( d, i ) {
                    return interp( i / domain.length )
                })
            }

            if ( isRange ) {
                return d3.scale.linear()
                    .domain( d3.extent( domain ) )
                    .range( [ colors.from, colors.to ] );
            } else {
                return d3.scale.ordinal()
                    .domain( domain )
                    .range( colors );
            }
        }

        return palette
    }

})();

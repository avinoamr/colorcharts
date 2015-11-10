(function () {
    var color = window.color;
    color.legend = function ( el ) {
        var legend = d3.select( el ).data()[ 0 ];

        if ( !( legend instanceof Legend ) ) {
            var legend = new Legend( el );
            d3.select( el ).data( [ legend ] );
        }
        
        return legend;
    }

    function Legend( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Legend.prototype._palette = window.color.palettes.default;;
    Legend.prototype._color = null;

    Legend.prototype.data = getset( "_data" );
    Legend.prototype.value = getset( "_value" );
    Legend.prototype.color = getset( "_color" );
    Legend.prototype.palette = getset( "_palette" );

    // draw once
    Legend.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Legend.prototype._draw = function () {
        clearTimeout( this._drawing );
        delete this._drawing;
        draw( this );
        return this;
    }


    function draw( that ) {
        var svg = d3.select( that._el )
            .select( "svg" )
            .style( "height", "100%" )
            .style( "width", "100%" );

        var radius = 6;
        var _v = that._value, _c = that._color;

        // extract the values for each obj
        var data = that._data.map( function ( d ) {
            return { v: d[ _v ], c: d[ _c ], obj: d }
        })

        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        // start drawing
        var groups = svg.selectAll( "g[data-group]" )
            .data( data )

        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-group", function ( d ) { 
                return d.v 
            });

        // we have to process each legend separately in order to compute the 
        // width used by each group before using it to compute the x-coordinate
        // of the next group
        var x = 0;
        groups.transition().each( function ( d ) {
            var group = d3.select( this )
                .attr( "transform", function () {
                    return "translate(" + x + ",0)";
                });

            var circle = group.selectAll( "circle" )
                .data( [ d ] );
            circle.enter().append( "circle" )
                .attr( "fill", c( d.c ) );
            circle
                .attr( "cx", radius )
                .attr( "cy", radius )
                .attr( "r", radius )
                .attr( "fill", c( d.c ) );

            var label = group.selectAll( "text" )
                .data( [ d ] );
            label.enter().append( "text" );
            label
                .text( d.v )
                .attr( "y", radius )
                .attr( "x", radius * 2 + 4 )
                .attr( "alignment-baseline", "middle" )
                .attr( "fill", "white" );

            x += label.node().offsetWidth + radius * 3 + 4;
        })

    }

    function getset ( key ) {
        return function ( value ) {
            if ( arguments.length == 0 ) {
                return this[ key ];
            }

            this[ key ] = value;
            return this;
        }
    }

})();

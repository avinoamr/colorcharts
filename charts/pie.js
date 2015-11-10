(function () {
    var color = window.color;
    color.pie = function ( el ) {
        var pie = d3.select( el ).data()[ 0 ];

        if ( !( pie instanceof Pie ) ) {
            var pie = new Pie( el );
            d3.select( el ).data( [ pie ] );
        }
        
        return pie;
    }

    function Pie( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Pie.prototype._palette = window.color.palettes.default;;
    Pie.prototype._color = null;

    Pie.prototype.data = getset( "_data" );
    Pie.prototype.value = getset( "_value" );
    Pie.prototype.color = getset( "_color" );
    Pie.prototype.palette = getset( "_palette" );

    // draw once
    Pie.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Pie.prototype._draw = function () {
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

        var height = svg.node().offsetHeight;
        var width = svg.node().offsetWidth;
        var radius = Math.min( height / 2, width / 2 ) - 10;
        var _v = that._value, _c = that._color;

        // extract the values for each obj
        var data = that._data.map( function ( d ) {
            var v = d[ _v ]

            if ( isNaN( +v ) ) {
                throw new Error( "value must be a number" );
            }

            return { v: v, c: d[ _c ], obj: d }
        })

        // group by colors
        data = d3.nest()
            .key( function ( d ) { return d.c  || "" } )
            .rollup ( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return v + d.v;
                }, 0 )
            })
            .entries( data );

        // lay out the pie
        data = d3.layout.pie()
            .sort( null )
            .value( function ( d ) { 
                return d.values
            })( data )
            .map( function ( d ) {
                d.key = d.data.key;
                delete d.data;
                return d;
            });

        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        var arc = d3.svg.arc()
            .outerRadius( radius )
            .innerRadius( 0 );

        // start drawing
        var pie = svg.selectAll( "g[pie]" )
            .data( [ data ] );
        pie.enter().append( "g" )
            .attr( "data-pie", "" )
            .attr( "transform", function () {
                return "translate(" + ( width / 2 ) + "," + ( height / 2 ) + ")";
            });

        var slices = pie.selectAll( "path[data-slice]" )
            .data( function ( d ) { return d } );
        slices.exit().remove();
        slices.enter().append( "path" )
        slices
            .attr( "data-slice", function ( d ) {
                return d.key;
            })
            .attr( "d", arc )
            .attr( "fill", function ( d ) {
                return c( d.key );
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

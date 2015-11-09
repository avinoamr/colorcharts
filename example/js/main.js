window.onload = function () {
    var chart;
    setTimeout( drawBar );

    var js = ace.edit( "js" )
    js.setTheme( "ace/theme/monokai" );
    js.getSession().setMode( "ace/mode/javascript" );
    js.$blockScrolling = Infinity;

    // run
    document.querySelector( "#run" )
        .addEventListener( "click", run );

    document.querySelector( "#line" )
        .addEventListener( "click", function ( ev ) {
            ev.preventDefault();
            drawLine();
        })

    document.querySelector( "#bar" )
        .addEventListener( "click", function ( ev ) {
            ev.preventDefault();
            drawBar();
        })

    // build the gui controls
    var gui = new dat.GUI();
    gui.obj = {
        set x ( v ) { getChart().x( v ); generateCode() },
        get x () { return getChart().x() },

        set x1 ( v ) { getChart().x1( v ); generateCode() },
        get x1 () { return getChart().x1() || "" },

        set y ( v ) { getChart().y( v ); generateCode() },
        get y () { return getChart().y() },

        set color ( v ) { getChart().color( v ); generateCode() },
        get color () { return getChart().color() || "" },

        set stack ( v ) { getChart().stack( v ); generateCode() },
        get stack () { return getChart().stack() || "" },

        set palette ( v ) {
            getChart().palette( window.color.palettes[ v ] );
            generateCode()
        },

        get palette () { 
            var palette = getChart().palette();
            return Object.keys( window.color.palettes )
                .filter( function ( key ) {
                    return palette == window.color.palettes[ key ];
                })[ 0 ]
        },
    }

    gui.close(); // auto-close


    function getBar() {
        return window.color( document.querySelector( "#chart" ) )
            .bar()
    }

    function getLine() {
        return window.color( document.querySelector( "#chart" ) )
            .line()
    }

    function getChart() {
        if ( chart == "bar" ) {
            return getBar()
        } else if ( chart == "line" ) {
            return getLine();
        }
    }

    function run() {
        var code = "var color = window.color;\n" + js.getValue();
        eval( code );
    }

    function drawLine() {
        chart = "line"
        getLine()
            .x( "release date" )
            .y( "number" )
            .data([
                { "movie": "American Beauty", "studio": "Paramount", "genre": "Drama", "count": 40, "number": 1, "release date": new Date( "September 17, 1999" ) },
                { "movie": "Star Wars", "studio": "Paramount", "genre": "Sci-Fi", "count": 39, "number": 5, "release date": new Date( "May 25, 1977" ) },
                { "movie": "Blade Runner", "studio": "Paramount", "genre": "Sci-Fi", "count": 27, "number": 8, "release date": new Date( "June 25, 1982" ) },
                { "movie": "Pulp Fiction", "studio": "Universal", "genre": "Drama", "count": 13, "number": 2, "release date": new Date( "October 14, 1994" ) },
                { "movie": "Men in Black", "studio": "Universal", "genre": "Sci-Fi", "count": 5, "number": 4, "release date": new Date( "July 2, 1997" ) }
            ]);

        while ( gui.__controllers.length ) {
            gui.remove( gui.__controllers[ 0 ] );
        }

        gui.add( gui.obj, "x", { "Release Date": "release date", Count: "count", Number: "number" } )
        gui.add( gui.obj, "y", { Count: "count", Number: "number" } )
        gui.add( gui.obj, "stack", { No: "", Yes: true } )
        gui.add( gui.obj, "color", { Auto: "", Movie: "movie", Genre: "genre", Studio: "studio" } )
        gui.add( gui.obj, "palette", { Default: "default", Paired: "paired", Greens: "greens" } )

        generateCode();
    }

    function drawBar() {
        chart = "bar"
        getBar()
            .x( "movie" )
            .y( "count" )
            .data([
                { "movie": "American Beauty", "studio": "Paramount", "genre": "Drama", "count": 40, "number": 1 },
                { "movie": "Star Wars", "studio": "Paramount", "genre": "Sci-Fi", "count": 39, "number": 5 },
                { "movie": "Blade Runner", "studio": "Paramount", "genre": "Sci-Fi", "count": 27, "number": 8 },
                { "movie": "Pulp Fiction", "studio": "Universal", "genre": "Drama", "count": 13, "number": 2 },
                { "movie": "Men in Black", "studio": "Universal", "genre": "Sci-Fi", "count": 5, "number": 4 }
            ]);

        while ( gui.__controllers.length ) {
            gui.remove( gui.__controllers[ 0 ] );
        }

        gui.add( gui.obj, "x", { Movie: "movie", Genre: "genre", Studio: "studio" } )
        gui.add( gui.obj, "x1", { None: "", Movie: "movie", Genre: "genre", Studio: "studio" } )
        gui.add( gui.obj, "y", { Count: "count", Number: "number" } )
        gui.add( gui.obj, "color", { Auto: "", Movie: "movie", Genre: "genre", Studio: "studio", Count: "count", Number: "number" } )
        gui.add( gui.obj, "palette", { Default: "default", Paired: "paired", Greens: "greens" } )

        generateCode()
    }

    function generateCode () {
        var bar = getChart();
        var code = Object.keys( gui.obj )
            .filter( function ( key ) {
                return getChart()[ key ] && !!gui.obj[ key ]; // remove defaults
            })
            .filter( function ( key ) {
                return key != "palette" || bar[ key ]() != window.color.palettes.default;
            })
            .reduce( function ( code, key ) {
                var v = bar[ key ]();
                v = typeof v != "string" || typeof v != "number"
                    ? JSON.stringify( v )
                    : '"' + v + '"';

                code.push( '.' + key + '(' + v + ')' );
                return code;
            }, [ "." + chart + "()" ] );

        var data = bar.data()
            .map( function ( d ) { 
                Object.keys( d )
                    .filter( function ( k ) { 
                        return d[ k ] instanceof Date
                    })
                    .forEach( function ( k ) {
                        d[ k ].toJSON = function () {
                            return "TODATE(" + this.getTime() + ")"
                        }
                    })

                var json = JSON.stringify( d )
                    .replace( /\"TODATE\((\d*)\)\"/, function ( match, t ) {
                        var d = new Date( +t ).toISOString();
                        return "new Date(" + JSON.stringify( d ) + ")"
                    });

                return "\t" + json + "," 
            });

        code = []
            .concat( code )
            .concat( '.data([', data, '])' )
            .map( function ( l ) { return "\t" + l } );

        code = [ 'color(document.querySelector("#chart"))' ]
            .concat( code )
            .join( "\n" );

        js.setValue( code, -1 );
    }
}
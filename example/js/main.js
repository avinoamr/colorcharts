window.onload = function () {
    var el = document.querySelector( "#chart" );
    var chart;

    setTimeout( drawPie );

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

    document.querySelector( "#pie" )
        .addEventListener( "click", function ( ev ) {
            ev.preventDefault();
            drawPie();
        })

    // build the gui controls
    var gui = new dat.GUI();
    gui.obj = {
        set value ( v ) { chart.value( v ).draw( el ); generateCode() },
        get value () { return chart.value() },

        set x ( v ) { chart.x( v ).draw( el ); generateCode() },
        get x () { return chart.x() },

        set x1 ( v ) { chart.x1( v ).draw( el ); generateCode() },
        get x1 () { return chart.x1() || "" },

        set y ( v ) { chart.y( v ).draw( el ); generateCode() },
        get y () { return chart.y() },

        set color ( v ) { chart.color( v ).draw( el ); generateCode() },
        get color () { return chart.color() || "" },

        set stack ( v ) { chart.stack( v ).draw( el ); generateCode() },
        get stack () { return chart.stack() || "" },

        set palette ( v ) {
            chart.palette( window.color.palettes[ v ] ).draw( el);
            generateCode()
        },

        get palette () { 
            var palette = chart.palette();
            return Object.keys( window.color.palettes )
                .filter( function ( key ) {
                    return palette == window.color.palettes[ key ];
                })[ 0 ]
        },
    }

    gui.close(); // auto-close

    function run() {
        var code = "var color = window.color;\n" + js.getValue();
        eval( code );
    }

    function drawLine() {
        chart = color.line()
            .x( "release date" )
            .y( "number" )
            .data([
                { "movie": "American Beauty", "studio": "Paramount", "genre": "Drama", "count": 40, "number": 1, "release date": new Date( "September 17, 1999" ) },
                { "movie": "Star Wars", "studio": "Paramount", "genre": "Sci-Fi", "count": 39, "number": 5, "release date": new Date( "May 25, 1977" ) },
                { "movie": "Blade Runner", "studio": "Paramount", "genre": "Sci-Fi", "count": 27, "number": 8, "release date": new Date( "June 25, 1982" ) },
                { "movie": "Pulp Fiction", "studio": "Universal", "genre": "Drama", "count": 13, "number": 2, "release date": new Date( "October 14, 1994" ) },
                { "movie": "Men in Black", "studio": "Universal", "genre": "Sci-Fi", "count": 5, "number": 4, "release date": new Date( "July 2, 1997" ) }
            ])
            .draw( el );

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
        chart = color.bar()
            .x( "movie" )
            .y( "count" )
            .data([
                { "movie": "American Beauty", "studio": "Paramount", "genre": "Drama", "count": 40, "number": 1 },
                { "movie": "Star Wars", "studio": "Paramount", "genre": "Sci-Fi", "count": 39, "number": 5 },
                { "movie": "Blade Runner", "studio": "Paramount", "genre": "Sci-Fi", "count": 27, "number": 8 },
                { "movie": "Pulp Fiction", "studio": "Universal", "genre": "Drama", "count": 13, "number": 2 },
                { "movie": "Men in Black", "studio": "Universal", "genre": "Sci-Fi", "count": 5, "number": 4 }
            ])
            .draw( el );

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

    function drawPie() {
        chart = color.pie()
            .value( "count" )
            .color( "movie" )
            .data([
                { "movie": "American Beauty", "studio": "Paramount", "genre": "Drama", "count": 40, "number": 1 },
                { "movie": "Star Wars", "studio": "Paramount", "genre": "Sci-Fi", "count": 39, "number": 5 },
                { "movie": "Blade Runner", "studio": "Paramount", "genre": "Sci-Fi", "count": 27, "number": 8 },
                { "movie": "Pulp Fiction", "studio": "Universal", "genre": "Drama", "count": 13, "number": 2 },
                { "movie": "Men in Black", "studio": "Universal", "genre": "Sci-Fi", "count": 5, "number": 4 }
            ])
            .draw( el );

        while ( gui.__controllers.length ) {
            gui.remove( gui.__controllers[ 0 ] );
        }

        gui.add( gui.obj, "value", { Count: "count", Number: "number" } )
        gui.add( gui.obj, "color", { Auto: "", Movie: "movie", Genre: "genre", Studio: "studio" } )
        gui.add( gui.obj, "palette", { Default: "default", Paired: "paired", Greens: "greens" } )

        generateCode()
    }

    function generateCode () {
        var code = Object.keys( gui.obj )
            .filter( function ( key ) {
                return chart[ key ] && !!gui.obj[ key ]; // remove defaults
            })
            .filter( function ( key ) {
                return key != "palette" || chart[ key ]() != window.color.palettes.default;
            })
            .reduce( function ( code, key ) {
                var v = chart[ key ]();
                v = typeof v != "string" || typeof v != "number"
                    ? JSON.stringify( v )
                    : '"' + v + '"';

                code.push( '.' + key + '(' + v + ')' );
                return code;
            }, [] );

        var data = chart.data()
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
            .concat( '.draw(document.querySelector("#chart"))' )
            .map( function ( l ) { return "\t" + l } );

        code = [ 'color.' + chart.name + "()" ]
            .concat( code )
            .join( "\n" ) + ";";

        js.setValue( code, -1 );
    }
}
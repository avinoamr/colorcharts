window.onload = function () {
    setTimeout( generateCode )
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

    var js = ace.edit( "js" )
    js.setTheme( "ace/theme/monokai" );
    js.getSession().setMode( "ace/mode/javascript" );

    // run
    document.querySelector( "#run" )
        .addEventListener( "click", run );

    // build the gui controls
    var gui = new dat.GUI();
    var obj = {
        set x ( v ) { getBar().x( v ); generateCode() },
        get x () { return getBar().x() },

        set x1 ( v ) { getBar().x1( v ); generateCode() },
        get x1 () { return getBar().x1() || "" },

        set y ( v ) { getBar().y( v ); generateCode() },
        get y () { return getBar().y() },

        set color ( v ) { getBar().color( v ); generateCode() },
        get color () { return getBar().color() || "" },

        set palette ( v ) {
            getBar().palette( window.color.palettes[ v ] );
            generateCode()
        },

        get palette () { 
            var palette = getBar().palette();
            return Object.keys( window.color.palettes )
                .filter( function ( key ) {
                    return palette == window.color.palettes[ key ];
                })[ 0 ]
        },
    }

    gui.close(); // auto-close

    gui.add( obj, "x", { Movie: "movie", Genre: "genre", Studio: "studio" } )
    gui.add( obj, "x1", { None: "", Movie: "movie", Genre: "genre", Studio: "studio" } )
    gui.add( obj, "y", { Count: "count", Number: "number" } )
    gui.add( obj, "color", { Auto: "", Movie: "movie", Genre: "genre", Studio: "studio", Count: "count", Number: "number" } )
    gui.add( obj, "palette", { Default: "default", Paired: "paired", Greens: "greens" } )

    function getBar() {
        return window.color( document.querySelector( "#chart" ) )
            .bar()
    }

    function run() {
        var code = "var color = window.color;\n" + js.getValue();
        eval( code );
    }

    function generateCode () {
        var bar = getBar();
        var code = Object.keys( obj )
            .filter( function ( key ) {
                return !!obj[ key ]; // remove defaults
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
            }, [ ".bar()" ] );

        var data = bar.data()
            .map( function ( d ) { 
                return "\t" + JSON.stringify( d ) + "," 
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
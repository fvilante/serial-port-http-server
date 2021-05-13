// Require the lib, get a working terminal

import { terminal as term, } from 'terminal-kit'
import { getMatrizesConhecidas } from '../serial-port/matrizes-conhecidas';


term.cyan( 'Juca de oliveira\n' ) ;

const arr = Object.keys(getMatrizesConhecidas())

term.bgYellow.white( 'Escolha uma matriz nenem:\n' ) ;

var items = arr;

term.gridMenu( items , function( error , response ) {
	term( '\n' ).eraseLineAfter.green(
		"#%s selected: %s (%s,%s)\n" ,
		response.selectedIndex ,
		response.selectedText ,
		response.x ,
		response.y
	) ;
	process.exit() ;
} ) ;
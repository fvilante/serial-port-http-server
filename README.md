

# Instalation and use

Prequisites:
    * NodeJS v14.13.1 or higher
    * Git

To clone repository, go the one father directory of your own choice and type:

```powershell
> git clone Z:\git_repos\Julia_Desktop
```

To install type dependencies, type:

```powershell
> cd Julia_Desktop
> npm install
```

## Example

For an example of how to move a single CMPP9908 board axis, see `\src\cmpp\utils\move-cmpp.ts`.

To execute any `.ts` file script use: `npx ts-node`. For example, to run `move-cmpp.ts` file change to the folder where this file exists and type `npx ts-node move-cmpp.ts`.

# Autodetect

To scan all CMPP9908 boards connected in the PC in the project folder type `npm run autodetectCmpp`. If the CMPP device is detected it you show you the COM port, baudrate and channel it was detected.

# Leon-i client

To run Leon-i program in the project folder type `npm run referenciar` to referentiate the 3-axis and then `npm run produzir` to start production mode.

> *Very Important*: Assure that the file `src/global-env/global_LAPTOP_FLAVIO.ts` contains the right COM ports of the 3-axis connected to the machine, otherwise an error will rise. 



//import { series } from 'gulp'

import { series, TaskFunction } from 'gulp'


// the 'clean' function is not exported so it can be considered a private task.
// it can still be used with the 'series()' composition.

const clean: TaskFunction = (done) => {
    // body omitted
    done()
}

// the 'build' function is exported so it is public and can be run with the 'gulp' command.
// it can also be used with the 'series()' composition.
const build: TaskFunction = (done: any) => {
    // body ommitted
    console.log("I'm build task")
    done()
}

const defaultTask: TaskFunction = (done: any) => {
    //place code for your default task here
    console.log("I'm default task")
    done() 
}

const BuildClean: TaskFunction = series(defaultTask, build)

// here you exports what you want to access through 'gulp-cli'
// FIX: There is a way to use 'ESNEXT' normal export/import keywords, but I don't have time now to research this solution. Could be better to do that in future. (principe of less variation from standard)
exports.build = build;
exports.default = BuildClean;
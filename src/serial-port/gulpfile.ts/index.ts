//import { series } from 'gulp'

import { series, TaskFunction } from 'gulp'
import { spawn } from 'child_process'


const clean: TaskFunction = (done) => {
    const ls = spawn('dir')
    ls.on('close', code => {
        console.log('ok dir has runned', code)
        done()
    })
    ls.stdout.on('data', data => {
        console.log('data=', String(data))
    })
   
}

const build: TaskFunction = (done: any) => {

    console.log("I'm build task")
    done()
}

const defaultTask: TaskFunction = (done: any) => {

    console.log("I'm default task")
    console.log("Executing datee")
    done() 
}

const BuildClean: TaskFunction = series(defaultTask, build)

// here you exports what you want to access through 'gulp-cli'
// FIX: There is a way to use 'ESNEXT' normal export/import keywords, but I don't have time now to research this solution. Could be better to do that in future. (principe of less variation from standard)
exports.build = build;
exports.default = clean;
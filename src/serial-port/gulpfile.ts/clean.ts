import del from 'del'
import normalize from 'normalize-path'

export const clearFrontEndBuildDirectory = async () => {
    const dryRun = false
    const buildFolder = '../front-end/build/*'
    console.log('deleting files from', buildFolder)
    const deletedFiles = await del(buildFolder, {force: true, dryRun})
    return deletedFiles.map(x => normalize(x))
}



clearFrontEndBuildDirectory().then( files => console.log('finished aha', files))

import { Maybe, Just } from "../adts/maybe";
import { BarCode } from './barcode-core';

// NOTE: You can filter keystroks of barcode reader to differentiate to normal typing doing this:
//      I verified inclusive in the LEONI_MACHINE computer what follows below: 
//          - normal typing: even when I type as fast as possible rarely the keystrokes interval
//            is less then 50ms (would say that certainly more than 90% of my typing is more than 50ms)
//          - barcode reading: In other hand, certainly more than 90% of barcode 'typing' has an
//          - interval less than 50ms
//      conclusion, if the reading evolve some characters, it is possible to use average mean to
//      calculate the probability of a sequence be typed by human or barcode reader.  
//if string is not a valid barcode return Nothing
//TODO: used Result instead of Maybe 
//TODO: Write a document to be a format specification for the barcode (put this document in the manual)
//TODO: Decide if the format should be permissive or restritive (ie: Trim spaces? Undiferentiate lower and upper cases?, etc)
export const parseBarCode = (barCode_: string): Maybe<BarCode> => {
    const barCode = barCode_.trim()
    //TODO: Improve algorithm to trim white spaces and be more 'typo robust'
    const mSharp = "M#";
    const separatorElement = '-'; //TODO: (in place of minus we should accept also ' ' and '_' even something else)
    const hasMSharp = barCode.startsWith(mSharp);
    const hasSeparator = barCode.includes(separatorElement);
    const barCodeWithoutMSharp = barCode.slice(2, barCode.length);
    const isBarCodeStructureOk = hasMSharp && hasSeparator;
    const [partNumber_, messageText_] = barCodeWithoutMSharp.split(separatorElement);
    const [partNumber, messageText] = [partNumber_?.trim() ?? 'Indefinido', messageText_?.trim() ?? 'Indefinido'] 

    return isBarCodeStructureOk === false // TODO: I'm not saving this lack of infrastructure
        ? Just({
            raw: barCode,
            partNumber,
            messageText,
        })
        : Just({
            raw: barCode,
            partNumber,
            messageText,
        });
};

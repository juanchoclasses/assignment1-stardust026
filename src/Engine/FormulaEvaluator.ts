import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  evaluate(formula: FormulaType) {


    // set the this._result to the length of the formula

    this._result = this.calculate(formula);

  }

  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }
  
  /**
   * Calculates the result of a given formula.
   * @param formula An array of tokens representing the formula to be evaluated.
   * @returns The numerical result of the formula.
   */
  calculate(formula: FormulaType): number {
    const stack:number[] = [];
    let num = 0;
    let sign = '+';
    this._errorMessage = "";
    const n:number = formula.length;

    // if the formula is empty return empty formula error
    if(n === 0){
      this._errorOccured = true;
      this._errorMessage = ErrorMessages.emptyFormula;
      return 0;
    }
    
    for (let i = 0; i < n; i++) {
        let current = formula[i];
        // if the current token is a number, convert it to a number            
        if (this.isNumber(current)) {
            num = Number(current);
        } 

        // if the current token is a cell reference, get the value of the cell
        else if (this.isCellReference(current)){
          let [value, error] = this.getCellValue(current);
          if (error !== "") {
            this._errorOccured = true;
            this._errorMessage = error;
          }
          num = value;
        }
        // if the current token is a left brace, find the matching right brace
        else if (current == '(') {
            let j = i + 1;
            let braces = 1;
            for (; j < n; j++) {
                if (formula[j] == '(') ++braces;
                if (formula[j] == ')') --braces;
                if (braces == 0) break;
            }
            if (braces != 0){
              this._errorOccured = true;
              this._errorMessage = ErrorMessages.missingParentheses;
              break;
            }
            if(i+1 === j){
              this._errorOccured = true;
              this._errorMessage = ErrorMessages.invalidFormula;
              break;
            }              
            num = this.calculate(formula.slice(i + 1, j));
            i = j;
        }

        // if the current token is a '@', convert it to a decimal
        else if(current == '@'){
          if(i-1 < 0 || !this.isNumber(formula[i-1])|| i+1 >= n || !this.isNumber(formula[i+1])){
            this._errorOccured = true;
            this._errorMessage = ErrorMessages.invalidFormula;
          } else {
            num = Number(formula[i-1]) + Number("0."+formula[i+1]);
            i++;
          }
        }
        
        // if the current token is an operator, push the number to the stack
        if (current == '+' || current == '-' || current == '*' || current == '/' || i == n - 1) {
          //if the next token is an operator return invalid formula error
          if(i+1 < n && (formula[i+1] == '+' || formula[i+1] == '-' || formula[i+1] == '*' || formula[i+1] == '/')){
            this._errorOccured = true;
            this._errorMessage = ErrorMessages.invalidFormula;
          }
            switch (sign) {
                case '+':
                    stack.push(num);
                    break;
                case '-':
                    stack.push(-num);
                    break;
                case '*':
                    var value: number | undefined = stack.pop();
                    if(value != undefined){
                    stack.push(value * num);
                    }
                    break;
                case '/':
                    var value: number | undefined = stack.pop();
                    //if the divisor is zero return divide by zero error
                    if(num == 0){
                      this._errorOccured = true;
                      this._errorMessage = ErrorMessages.divideByZero;
                      return Infinity;
                    }
                    if(value != undefined){
                    stack.push(value / num);
                    }
                    break;
            }
            num = 0;
            sign = current;
        }
  }
  //if the formula end with an operator return invalid formula error
  if(formula[n-1] == '+' || formula[n-1] == '-' || formula[n-1] == '*' || formula[n-1] == '/'){
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
  }

  //if the formula starts with an operator (except '-') return invalid formula error
  if(formula[0] == '+' || formula[0] == '*' || formula[0] == '/'){
    this._errorOccured = true;
    this._errorMessage = ErrorMessages.invalidFormula;
  }

  //if the stack is empty return the number
  if(stack.length === 0){
    return num;
  }
  //if the stack is not empty, call getResult
  return this.getResult(stack);
  }


  /**
   * Calculates the sum of an array of numbers.
   * 
   * @param s An array of numbers to sum.
   * @returns The sum of the numbers in the array.
   */
  getResult(s: number[]): number {
    let result = 0;
    if (s.length == 0) {
      return 0;
    }
    for (let i = 0; i < s.length; i++) {
      result += s[i];
    }
    return result;
  }



  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;
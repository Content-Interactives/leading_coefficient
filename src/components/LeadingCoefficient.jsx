import React, { useState } from 'react';

export default function LeadingCoefficient() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  // No debugging state

  const checkValidity = (expression) => {
    if (!expression || expression.trim() === '') {
      return false;
    }

    try {
      const hasBalancedParentheses = (expr) => {
        let count = 0;
        for (let i = 0; i < expr.length; i++) {
          if (expr[i] === '(') count++;
          else if (expr[i] === ')') count--;
          
          if (count < 0) return false;
        }
        return count === 0;
      };
      
      if (!hasBalancedParentheses(expression)) {
        return false;
      }
      
      const hasVariable = /[a-z]/i.test(expression);
      if (!hasVariable) {
        return false;
      }
      
      const normalized = expression.trim().toLowerCase();
      
      // Check for incomplete exponents like "x^" with no following number
      const incompleteExponentPattern = /\^([^0-9]|$)/;
      if (incompleteExponentPattern.test(normalized)) {
        return false;
      }
      
      // No longer checking for division symbols - allowing "/" in input
      
      // Check for improper multiplication (like 2**3 or x**y)
      const improperMultiplicationPattern = /\*\*/;
      if (improperMultiplicationPattern.test(normalized)) {
        return false;
      }
      
      const variableMatches = normalized.match(/[a-z]/ig) || [];
      const uniqueVariables = [...new Set(variableMatches)];
      
      const missingOperatorPattern = /(\d+\s+[a-z]|\d+[a-z]\s+\d+|[a-z]\^?\d*\s+\d+|[a-z]\^?\d*\s+[a-z])/i;
      if (missingOperatorPattern.test(normalized)) {
        return false;
      }
      
      const exponentPattern = /\^[^0-9]/i;
      if (exponentPattern.test(normalized)) {
        return false;
      }
      
      const varPattern = uniqueVariables.join('|');
      
      const termRegex = new RegExp(`[+-]?\\s*\\d*\\.?\\d*\\s*(?:${varPattern})\\s*(?:\\^\\s*\\d+)?|[+-]?\\s*\\d+\\.?\\d*`, 'gi');
      
      let matches = normalized.match(termRegex);
      
      let filteredMatches = [];
      if (matches) {
        filteredMatches = matches.filter(term => {
          const cleaned = term.trim();
          return cleaned !== '+' && cleaned !== '-' && cleaned !== '';
        });
      }
      
      if (!filteredMatches || filteredMatches.length === 0) {
        return false;
      }
      
      for (const term of filteredMatches) {
        const cleanTerm = term.replace(/\s+/g, '');
        
        if (cleanTerm.includes('^')) {
          const parts = cleanTerm.split('^');
          if (parts.length > 1) {
            const exponentPart = parts[1];
            
            if (/[a-z]/i.test(exponentPart)) {
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (err) {
      return false;
    }
  };

  // Helper function to parse variable structure and extract variables with powers
  // Now handles division with negative powers
  const parseVariablesInTerm = (term) => {
    // First, remove coefficient from term
    const cleanTerm = term.replace(/\s+/g, '');
    
    // Split the term into numerator and denominator
    const parts = cleanTerm.split('/');
    const numerator = parts[0];
    const denominator = parts.length > 1 ? parts[1] : '';
    
    // Extract coefficients from numerator and denominator
    const numCoeffMatch = numerator.match(/^([+-]?\d*\.?\d*)/);
    const denomCoeffMatch = denominator.match(/^([+-]?\d*\.?\d*)/);
    
    let numCoeff = 1;
    let denomCoeff = 1;
    
    if (numCoeffMatch && numCoeffMatch[1]) {
      if (numCoeffMatch[1] === '-') {
        numCoeff = -1;
      } else if (numCoeffMatch[1] === '+') {
        numCoeff = 1;
      } else {
        numCoeff = parseFloat(numCoeffMatch[1]) || 1;
      }
    }
    
    if (denomCoeffMatch && denomCoeffMatch[1]) {
      if (denomCoeffMatch[1] === '-') {
        denomCoeff = -1;
      } else if (denomCoeffMatch[1] === '+') {
        denomCoeff = 1;
      } else {
        denomCoeff = parseFloat(denomCoeffMatch[1]) || 1;
      }
    }
    
    // Process numerator variables
    let numeratorVarPart = numerator.replace(/^[+-]?\d*\.?\d*/, '');
    const variablesWithPowers = [];
    
    // If term has no variables, return an empty array
    if (!numeratorVarPart && !denominator) {
      return [];
    }
    
    // Process numerator variables (positive powers)
    if (numeratorVarPart && /[a-z]/i.test(numeratorVarPart)) {
      let currentIndex = 0;
      
      while (currentIndex < numeratorVarPart.length) {
        if (/[a-z]/i.test(numeratorVarPart[currentIndex])) {
          const variable = numeratorVarPart[currentIndex];
          let power = 1;
          currentIndex++;
          
          // Check if there's an explicit exponent with ^ symbol
          if (currentIndex < numeratorVarPart.length && numeratorVarPart[currentIndex] === '^') {
            currentIndex++; // Skip past the '^'
            let powerStr = '';
            
            // Extract the power digits
            while (currentIndex < numeratorVarPart.length && /\d/.test(numeratorVarPart[currentIndex])) {
              powerStr += numeratorVarPart[currentIndex];
              currentIndex++;
            }
            
            if (powerStr) {
              power = parseInt(powerStr);
            }
          }
          // Check for consecutive occurrences of the same variable (like yyy)
          else {
            let consecutiveCount = 1; // We already counted one occurrence
            
            while (currentIndex < numeratorVarPart.length && 
                   numeratorVarPart[currentIndex].toLowerCase() === variable.toLowerCase()) {
              consecutiveCount++;
              currentIndex++;
              
              // Check if there's an explicit exponent after the consecutive variables
              if (currentIndex < numeratorVarPart.length && numeratorVarPart[currentIndex] === '^') {
                break; // Let the next iteration handle the explicit exponent
              }
            }
            
            if (consecutiveCount > 1) {
              power = consecutiveCount;
            }
          }
          
          // Check if this variable already exists in our array
          const existingVarIndex = variablesWithPowers.findIndex(
            v => v.variable.toLowerCase() === variable.toLowerCase()
          );
          
          if (existingVarIndex >= 0) {
            // Add to existing power if variable already exists
            variablesWithPowers[existingVarIndex].power += power;
          } else {
            // Add variable with its power to the array
            variablesWithPowers.push({ variable, power });
          }
        } else {
          // Skip any non-variable characters
          currentIndex++;
        }
      }
    }
    
    // Process denominator variables (negative powers)
    if (denominator && /[a-z]/i.test(denominator)) {
      let denominatorVarPart = denominator.replace(/^[+-]?\d*\.?\d*/, '');
      let currentIndex = 0;
      
      while (currentIndex < denominatorVarPart.length) {
        if (/[a-z]/i.test(denominatorVarPart[currentIndex])) {
          const variable = denominatorVarPart[currentIndex];
          let power = 1; // Start with power of 1 (becomes -1 for denominator)
          currentIndex++;
          
          // Check if there's an explicit exponent with ^ symbol
          if (currentIndex < denominatorVarPart.length && denominatorVarPart[currentIndex] === '^') {
            currentIndex++; // Skip past the '^'
            let powerStr = '';
            
            // Extract the power digits
            while (currentIndex < denominatorVarPart.length && /\d/.test(denominatorVarPart[currentIndex])) {
              powerStr += denominatorVarPart[currentIndex];
              currentIndex++;
            }
            
            if (powerStr) {
              power = parseInt(powerStr);
            }
          }
          // Check for consecutive occurrences of the same variable (like yyy)
          else {
            let consecutiveCount = 1; // We already counted one occurrence
            
            while (currentIndex < denominatorVarPart.length && 
                   denominatorVarPart[currentIndex].toLowerCase() === variable.toLowerCase()) {
              consecutiveCount++;
              currentIndex++;
              
              // Check if there's an explicit exponent after the consecutive variables
              if (currentIndex < denominatorVarPart.length && denominatorVarPart[currentIndex] === '^') {
                break; // Let the next iteration handle the explicit exponent
              }
            }
            
            if (consecutiveCount > 1) {
              power = consecutiveCount;
            }
          }
          
          // Make power negative since it's in the denominator
          power = -power;
          
          // Check if this variable already exists in our array
          const existingVarIndex = variablesWithPowers.findIndex(
            v => v.variable.toLowerCase() === variable.toLowerCase()
          );
          
          if (existingVarIndex >= 0) {
            // Add to existing power if variable already exists
            variablesWithPowers[existingVarIndex].power += power;
          } else {
            // Add variable with its negative power to the array
            variablesWithPowers.push({ variable, power });
          }
        } else {
          // Skip any non-variable characters
          currentIndex++;
        }
      }
    }
    
    // Calculate the final coefficient by dividing numerator coefficient by denominator coefficient
    const finalCoeff = numCoeff / denomCoeff;
    
    // If there are no variables, add a special entry to represent the coefficient
    if (variablesWithPowers.length === 0) {
      variablesWithPowers.push({ variable: 'constant', power: 0, coefficient: finalCoeff });
    } else {
      // Add the coefficient to the first variable entry
      variablesWithPowers[0].coefficient = finalCoeff;
    }
    
    // Remove any variables with zero power
    return variablesWithPowers.filter(v => v.power !== 0);
  };

  // Calculate total degree of a term based on sum of all variable powers
  // Handles negative powers correctly for division
  const calculateTotalDegree = (variablesWithPowers) => {
    return variablesWithPowers.reduce((sum, { power }) => sum + power, 0);
  };

  const analyzePolynomial = (expression) => {
    setError(null);

    if (!expression || expression.trim() === '') {
      setError("Please enter a polynomial");
      return null;
    }

    try {
      let processedExpression = expression;
      
      const hasVariable = /[a-z]/i.test(processedExpression);
      if (!hasVariable) {
        throw new Error("Expression must contain at least one variable term");
      }
      
      function processNestedParentheses(expr) {
        const complexNestedPattern = /([^()\s]*[a-z][^()\s]*)\(([^()]+)\)\(([^()]+)\)/;
        const match = expr.match(complexNestedPattern);
        
        if (match) {
          const [fullMatch, prefix, firstExpr, secondExpr] = match;
          
          const firstTerms = firstExpr.split(/([+\-])/g).filter(Boolean);
          const parsedFirstTerms = [];
          let currentOp = '+';
          
          for (const term of firstTerms) {
            if (term === '+' || term === '-') {
              currentOp = term;
            } else if (term.trim()) {
              parsedFirstTerms.push({
                operator: currentOp,
                term: term.trim()
              });
            }
          }
          
          const secondTerms = secondExpr.split(/([+\-])/g).filter(Boolean);
          const parsedSecondTerms = [];
          currentOp = '+';
          
          for (const term of secondTerms) {
            if (term === '+' || term === '-') {
              currentOp = term;
            } else if (term.trim()) {
              parsedSecondTerms.push({
                operator: currentOp,
                term: term.trim()
              });
            }
          }
          
          const distributedTerms = [];
          
          for (const firstTerm of parsedFirstTerms) {
            for (const secondTerm of parsedSecondTerms) {
              const resultOperator = (firstTerm.operator === secondTerm.operator) ? '+' : '-';
              
              const combined = `${prefix}${firstTerm.term}${secondTerm.term}`;
              
              if (resultOperator === '+' || distributedTerms.length === 0) {
                distributedTerms.push(combined);
              } else {
                distributedTerms.push(`-${combined}`);
              }
            }
          }
          
          return distributedTerms.join(' + ').replace(/\+ -/g, '- ');
        }
        
        return expr;
      }
      
      processedExpression = processNestedParentheses(processedExpression);
      
      const multiplyPattern = /(\d*\.?\d*)([a-z])(?:\^(\d+))?[\s*]+(\d*\.?\d*)([a-z])(?:\^(\d+))?/gi;
      const implicitMultiplyPattern = /(\d*\.?\d*)([a-z])(?:\^(\d+))?\(([^()]+)\)/gi;
      
      function extractVarPart(variable, exponent) {
        const result = new Map();
        result.set(variable, exponent);
        return result;
      }
      
      function getCombinedVarMap(varMaps) {
        const result = new Map();
        
        for (const varMap of varMaps) {
          for (const [variable, exponent] of varMap.entries()) {
            result.set(variable, (result.get(variable) || 0) + exponent);
          }
        }
        
        return result;
      }
      
      function formatVarMap(varMap) {
        const sortedVars = [...varMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        
        let result = '';
        for (const [variable, exponent] of sortedVars) {
          if (exponent === 1) {
            result += variable;
          } else {
            result += `${variable}^${exponent}`;
          }
        }
        
        return result;
      }
      
      let hasMultiplication = true;
      let multiplicationPass = 0;
      
      while (hasMultiplication && multiplicationPass < 10) {
        multiplicationPass++;
        hasMultiplication = false;
        
        if (processedExpression.includes('*')) {
          hasMultiplication = true;
          
          const parts = processedExpression.split('*');
          
          if (parts.length >= 2) {
            let totalCoefficient = 1;
            const allVarMaps = [];
            
            for (const part of parts) {
              const trimmedPart = part.trim();
              
              if (trimmedPart === '') continue;
              
              const coeffMatch = trimmedPart.match(/^(-?\d*\.?\d*)/);
              let coefficient = 1;
              
              if (coeffMatch && coeffMatch[1] !== '') {
                if (coeffMatch[1] === '-') {
                  coefficient = -1;
                } else if (coeffMatch[1] === '+') {
                  coefficient = 1;
                } else {
                  coefficient = parseFloat(coeffMatch[1]) || 1;
                }
              }
              
              totalCoefficient *= coefficient;
              
              const varMatches = [...trimmedPart.matchAll(/([a-z])(?:\^(\d+))?/gi)] || [];
              const varMap = new Map();
              
              for (const varMatch of varMatches) {
                const varName = varMatch[1].toLowerCase();
                const varPower = varMatch[2] ? parseInt(varMatch[2]) : 1;
                varMap.set(varName, (varMap.get(varName) || 0) + varPower);
              }
              
              if (varMap.size > 0) {
                allVarMaps.push(varMap);
              }
            }
            
            const combinedVarMap = new Map();
            
            for (const varMap of allVarMaps) {
              for (const [varName, power] of varMap.entries()) {
                combinedVarMap.set(varName, (combinedVarMap.get(varName) || 0) + power);
              }
            }
            
            const formattedVars = formatVarMap(combinedVarMap);
            const result = totalCoefficient === 1 ? formattedVars : 
                         (totalCoefficient === -1 ? `-${formattedVars}` : `${totalCoefficient}${formattedVars}`);
            
            processedExpression = result;
          }
        } else {
          break;
        }
      }
      
      function processParentheses(expr) {
        let result = expr;
        
        let parenthesesPass = 0;
        while (result.includes('(') && parenthesesPass < 10) {
          parenthesesPass++;
          
          const parenMatches = [...result.matchAll(/\(([^()]+)\)/g)];
          
          if (parenMatches.length === 0) break;
          
          let changedInPass = false;
          
          for (const parenMatch of parenMatches) {
            const fullMatch = parenMatch[0];
            const innerContent = parenMatch[1];
            
            if (!innerContent.includes('(')) {
              const prefixMatch = result.substring(0, parenMatch.index).match(/(\d*\.?\d*)([a-z])(?:\^(\d+))?$/i);
              
              if (prefixMatch) {
                const prefixStart = parenMatch.index - prefixMatch[0].length;
                const fullExpr = result.substring(prefixStart, parenMatch.index + fullMatch.length);
                
                const prefix = prefixMatch[0];
                const prefixCoeff = prefixMatch[1] ? parseFloat(prefixMatch[1]) : 1;
                const prefixVar = prefixMatch[2];
                const prefixExp = prefixMatch[3] ? parseInt(prefixMatch[3]) : 1;
                
                const prefixTerm = prefixExp === 1 ? 
                                prefixVar : 
                                `${prefixVar}^${prefixExp}`;
                
                const innerTerms = innerContent.split(/([+\-])/g).filter(Boolean);
                const processedInnerTerms = [];
                let currentOperator = '+';
                
                for (const term of innerTerms) {
                  if (term === '+' || term === '-') {
                    currentOperator = term;
                  } else {
                    const trimmedTerm = term.trim();
                    if (trimmedTerm !== '') {
                      processedInnerTerms.push({
                        operator: currentOperator,
                        term: trimmedTerm
                      });
                    }
                  }
                }
                
                const distributedTerms = [];
                
                for (const { operator, term } of processedInnerTerms) {
                  if (term.match(/[a-z]/i)) {
                    const termMatch = term.match(/^([\d.]*)([a-z])(?:\^(\d+))?/i);
                    
                    if (termMatch) {
                      const termCoeff = termMatch[1] ? parseFloat(termMatch[1]) : 1;
                      const termVar = termMatch[2];
                      const termExp = termMatch[3] ? parseInt(termMatch[3]) : 1;
                      
                      const newCoeff = prefixCoeff * termCoeff;
                      
                      let distributedTerm;
                      
                      if (prefixVar.toLowerCase() === termVar.toLowerCase()) {
                        const newExp = prefixExp + termExp;
                        const varPart = newExp === 1 ? 
                                       prefixVar : 
                                       `${prefixVar}^${newExp}`;
                        
                        distributedTerm = newCoeff === 1 ? 
                                         varPart : 
                                         `${newCoeff}${varPart}`;
                      } else {
                        const prefixVarPart = prefixExp === 1 ? 
                                           prefixVar : 
                                           `${prefixVar}^${prefixExp}`;
                        
                        const termVarPart = termExp === 1 ? 
                                         termVar : 
                                         `${termVar}^${termExp}`;
                        
                        const sortedVarParts = [prefixVarPart, termVarPart].sort();
                        
                        distributedTerm = newCoeff === 1 ? 
                                         `${sortedVarParts.join('')}` : 
                                         `${newCoeff}${sortedVarParts.join('')}`;
                      }
                      
                      if (operator === '-') {
                        if (distributedTerm.startsWith('-')) {
                          distributedTerm = distributedTerm.substring(1);
                        } else {
                          distributedTerm = `-${distributedTerm}`;
                        }
                      }
                      
                      distributedTerms.push(distributedTerm);
                    }
                  } else {
                    const termCoeff = parseFloat(term) || 0;
                    const newCoeff = prefixCoeff * termCoeff;
                    
                    const varPart = prefixExp === 1 ? 
                                  prefixVar : 
                                  `${prefixVar}^${prefixExp}`;
                    
                    let distributedTerm = newCoeff === 1 ? 
                                        varPart : 
                                        `${newCoeff}${varPart}`;
                    
                    if (operator === '-') {
                      if (distributedTerm.startsWith('-')) {
                        distributedTerm = distributedTerm.substring(1);
                      } else {
                        distributedTerm = `-${distributedTerm}`;
                      }
                    }
                    
                    distributedTerms.push(distributedTerm);
                  }
                }
                
                const replacement = distributedTerms.join(' + ').replace(/\+ -/g, '- ');
                
                result = result.substring(0, prefixStart) + replacement + result.substring(prefixStart + fullExpr.length);
                changedInPass = true;
              } else {
                const nextChar = result.charAt(parenMatch.index + fullMatch.length);
                if (nextChar === '(') {
                  result = result.replace(fullMatch, innerContent);
                  changedInPass = true;
                } else {
                  result = result.replace(fullMatch, innerContent);
                  changedInPass = true;
                }
              }
              
              if (changedInPass) {
                break;
              }
            }
          }
          
          if (!changedInPass && result.includes('(')) {
            const nestedPattern = /\(([^()]+)\)\(([^()]+)\)/;
            const nestedMatch = result.match(nestedPattern);
            
            if (nestedMatch) {
              const fullNestedExpr = nestedMatch[0];
              const firstExpr = nestedMatch[1];
              const secondExpr = nestedMatch[2];
              
              const firstTerms = firstExpr.split(/([+\-])/g).filter(Boolean);
              const parsedFirstTerms = [];
              let currentOperator = '+';
              
              for (const term of firstTerms) {
                if (term === '+' || term === '-') {
                  currentOperator = term;
                } else {
                  const trimmedTerm = term.trim();
                  if (trimmedTerm !== '') {
                    parsedFirstTerms.push({
                      operator: currentOperator,
                      term: trimmedTerm
                    });
                  }
                }
              }
              
              const secondTerms = secondExpr.split(/([+\-])/g).filter(Boolean);
              const parsedSecondTerms = [];
              currentOperator = '+';
              
              for (const term of secondTerms) {
                if (term === '+' || term === '-') {
                  currentOperator = term;
                } else {
                  const trimmedTerm = term.trim();
                  if (trimmedTerm !== '') {
                    parsedSecondTerms.push({
                      operator: currentOperator,
                      term: trimmedTerm
                    });
                  }
                }
              }
              
              const distributedTerms = [];
              
              for (const firstTerm of parsedFirstTerms) {
                for (const secondTerm of parsedSecondTerms) {
                  const resultOperator = (firstTerm.operator === secondTerm.operator) ? '+' : '-';
                  
                  const term1 = firstTerm.term;
                  const term2 = secondTerm.term;
                  
                  const term1Match = term1.match(/^([\d.]*)([a-z][a-z^0-9]*)?/i);
                  const term1Coeff = term1Match && term1Match[1] !== '' ? parseFloat(term1Match[1]) : 1;
                  const term1Var = term1Match && term1Match[2] ? term1Match[2] : '';
                  
                  const term2Match = term2.match(/^([\d.]*)([a-z][a-z^0-9]*)?/i);
                  const term2Coeff = term2Match && term2Match[1] !== '' ? parseFloat(term2Match[1]) : 1;
                  const term2Var = term2Match && term2Match[2] ? term2Match[2] : '';
                  
                  const newCoeff = term1Coeff * term2Coeff;
                  
                  let varPart = '';
                  if (term1Var && term2Var) {
                    varPart = term1Var + term2Var;
                  } else if (term1Var) {
                    varPart = term1Var;
                  } else if (term2Var) {
                    varPart = term2Var;
                  }
                  
                  let distributedTerm;
                  if (varPart) {
                    distributedTerm = newCoeff === 1 ? 
                                    varPart : 
                                    `${newCoeff}${varPart}`;
                  } else {
                    distributedTerm = `${newCoeff}`;
                  }
                  
                  if (resultOperator === '-') {
                    if (distributedTerm.startsWith('-')) {
                      distributedTerm = distributedTerm.substring(1);
                    } else {
                      distributedTerm = `-${distributedTerm}`;
                    }
                  }
                  
                  distributedTerms.push(distributedTerm);
                }
              }
              
              let replacement = distributedTerms.join(' + ').replace(/\+ -/g, '- ');
              
              result = result.replace(fullNestedExpr, replacement);
              changedInPass = true;
            }
          }
          
          if (!changedInPass) {
            break;
          }
        }
        
        return result;
      }
      
      processedExpression = processParentheses(processedExpression);
      
      while (processedExpression.match(implicitMultiplyPattern)) {
        let implicitMatch;
        let tempExpression = processedExpression;
        
        while ((implicitMatch = implicitMultiplyPattern.exec(tempExpression)) !== null) {
          const outerCoeff = implicitMatch[1] ? parseFloat(implicitMatch[1]) : 1;
          const outerVar = implicitMatch[2];
          const outerExp = implicitMatch[3] ? parseInt(implicitMatch[3]) : 1;
          const innerExpression = implicitMatch[4];
          
          if (innerExpression.match(/^[\d.]*[a-z](?:\^\d+)?$/i)) {
            const innerMatch = innerExpression.match(/^([\d.]*)([a-z])(?:\^(\d+))?$/i);
            
            if (innerMatch) {
              const innerCoeff = innerMatch[1] ? parseFloat(innerMatch[1]) : 1;
              const innerVar = innerMatch[2].toLowerCase();
              const innerExp = innerMatch[3] ? parseInt(innerMatch[3]) : 1;
              
              const newCoeff = outerCoeff * innerCoeff;
              
              const oldTerm = implicitMatch[0];
              let newTerm;
              
              if (outerVar.toLowerCase() === innerVar) {
                const newExp = outerExp + innerExp;
                newTerm = newCoeff === 1 ? 
                        `${outerVar}^${newExp}` : 
                        `${newCoeff}${outerVar}^${newExp}`;
              } else {
                let outerVarPart = outerExp === 1 ? outerVar : `${outerVar}^${outerExp}`;
                let innerVarPart = innerExp === 1 ? innerVar : `${innerVar}^${innerExp}`;
                
                const sortedVarParts = [outerVarPart, innerVarPart].sort();
                
                newTerm = newCoeff === 1 ? 
                        `${sortedVarParts.join('')}` : 
                        `${newCoeff}${sortedVarParts.join('')}`;
              }
              
              processedExpression = processedExpression.replace(oldTerm, newTerm);
              tempExpression = tempExpression.replace(oldTerm, "PROCESSED");
              break;
            }
          }
        }
      }
      
      const normalized = processedExpression.trim().toLowerCase();
      
      const variableMatches = normalized.match(/[a-z]/ig) || [];
      const uniqueVariables = [...new Set(variableMatches)];
      
      if (uniqueVariables.length === 0) {
        throw new Error("No valid variables found in expression");
      }
      
      const missingOperatorPattern = /(\d+\s+[a-z]|\d+[a-z]\s+\d+|[a-z]\^?\d*\s+\d+|[a-z]\^?\d*\s+[a-z])/i;
      if (missingOperatorPattern.test(normalized)) {
        throw new Error("All terms must be separated by operators (+ or -)");
      }
      
      const varPattern = uniqueVariables.join('|');
      
      // This regex needs to be more flexible to handle multi-variable and division terms
      const termRegex = new RegExp(`[+-]?\\s*\\d*\\.?\\d*\\s*[a-z][a-z\\^0-9/]*|[+-]?\\s*\\d+\\.?\\d*`, 'gi');
      
      let matches = normalized.match(termRegex);
      
      let filteredMatches = [];
      if (matches) {
        filteredMatches = matches.filter(term => {
          const cleaned = term.trim();
          return cleaned !== '+' && cleaned !== '-' && cleaned !== '';
        });
      }
      
      if (!filteredMatches || filteredMatches.length === 0) {
        throw new Error("No valid polynomial terms found");
      }
      
      // Parse terms and calculate correct degrees for multi-variable terms
      const parsedTerms = [];
      
      for (const term of filteredMatches) {
        const cleanTerm = term.replace(/\s+/g, '');
        
        if (!/[a-z]/i.test(cleanTerm)) {
          // Constant term
          parsedTerms.push({ 
            coefficient: parseFloat(cleanTerm), 
            variable: null, 
            variables: [],
            degree: 0, 
            originalTerm: cleanTerm 
          });
          continue;
        }
        
        // Extract coefficient and variables
        const variablesWithPowers = parseVariablesInTerm(cleanTerm);
        
        // Get the coefficient from the variables array if it exists
        let coefficient = 1;
        if (variablesWithPowers.length > 0) {
          // Get coefficient from the first variable entry
          coefficient = variablesWithPowers[0].coefficient || 1;
        } else {
          // If no variables, use the first coefficient found
          const coeffMatch = cleanTerm.match(/^([+-]?\d*\.?\d*)/);
          if (coeffMatch && coeffMatch[1]) {
            if (coeffMatch[1] === '-') {
              coefficient = -1;
            } else if (coeffMatch[1] === '+') {
              coefficient = 1;
            } else {
              coefficient = parseFloat(coeffMatch[1]) || 1;
            }
          }
        }
        
        // Calculate total degree as sum of all variable powers
        const totalDegree = calculateTotalDegree(variablesWithPowers);
        
        // Create a combined variable string (used for grouping similar terms)
        // Sort variables to ensure consistent representation
        const sortedVars = [...variablesWithPowers]
          .filter(v => v.variable !== 'constant')
          .sort((a, b) => a.variable.localeCompare(b.variable));
        
        let variableStr = '';
        for (const { variable, power } of sortedVars) {
          variableStr += variable + (power > 1 ? `^${power}` : '');
        }
        
        parsedTerms.push({ 
          coefficient, 
          variables: variablesWithPowers.filter(v => v.variable !== 'constant'),
          variable: variableStr, // Store the combined variable representation 
          degree: totalDegree,   // Store the correct total degree
          originalTerm: cleanTerm
        });
      }
      
      // Group terms with same variable pattern
      const termsByVariable = {};
      
      parsedTerms.forEach(term => {
        const variableKey = term.variable || 'constant';
        
        if (!termsByVariable[variableKey]) {
          termsByVariable[variableKey] = [];
        }
        
        termsByVariable[variableKey].push(term);
      });
      
      // Consolidate like terms
      const consolidatedByVariable = {};
      
      Object.entries(termsByVariable).forEach(([variable, terms]) => {
        if (terms.length === 1) {
          // Single term, no need to consolidate
          consolidatedByVariable[variable] = [{
            variable: variable === 'constant' ? null : variable,
            variables: terms[0].variables,
            degree: terms[0].degree,
            coefficient: terms[0].coefficient,
            originalTerm: terms[0].originalTerm
          }];
        } else {
          // Multiple terms with the same variable pattern, sum the coefficients
          const totalCoeff = terms.reduce((sum, term) => sum + term.coefficient, 0);
          
          if (totalCoeff !== 0) {
            consolidatedByVariable[variable] = [{
              variable: variable === 'constant' ? null : variable,
              variables: terms[0].variables, // All terms in this group have the same variable structure
              degree: terms[0].degree,       // All terms in this group have the same degree
              coefficient: totalCoeff,
              originalTerm: terms[0].originalTerm
            }];
          }
        }
      });
      
      // Find the term with highest degree
      let maxDegree = -1;
      let leadingTerm = null;
      
      Object.values(consolidatedByVariable).forEach(terms => {
        if (terms && terms.length > 0) {
          const term = terms[0];
          if (term.degree > maxDegree) {
            maxDegree = term.degree;
            leadingTerm = term;
          }
        }
      });
      
      if (!leadingTerm) {
        // Only constants or empty expression
        const constantTerms = consolidatedByVariable['constant'] || [];
        if (constantTerms.length > 0) {
          return {
            originalExpression: expression,
            processedExpression: processedExpression,
            leadingTerm: constantTerms[0].coefficient.toString(),
            leadingCoefficient: constantTerms[0].coefficient,
            degree: 0,
            variable: null,
            variables: [],
            allVariables: uniqueVariables
          };
        } else {
          return {
            originalExpression: expression,
            processedExpression: processedExpression,
            leadingTerm: "0",
            leadingCoefficient: 0,
            degree: 0,
            variable: null,
            variables: [],
            allVariables: uniqueVariables
          };
        }
      }
      
      // Format the leading term for display
      const formatTermText = (term) => {
        if (!term.variable) {
          return term.coefficient.toString();
        }
        
        const coeff = term.coefficient;
        
        if (coeff === 1) {
          return term.variable;
        } else if (coeff === -1) {
          return `-${term.variable}`;
        } else {
          return `${coeff}${term.variable}`;
        }
      };
      
      const leadingTermText = formatTermText(leadingTerm);
      
      // No debug info preparation
      
      return {
        originalExpression: expression,
        processedExpression: processedExpression,
        leadingTerm: leadingTermText,
        leadingCoefficient: leadingTerm.coefficient,
        degree: leadingTerm.degree,
        variable: leadingTerm.variable,
        variables: leadingTerm.variables,
        allVariables: uniqueVariables
      };
    } catch (err) {
      setError(err.message || "Invalid polynomial expression");
      return null;
    }
  };

  // Improved formatter that correctly handles multi-variable terms with their powers
  // Now handles division (negative powers) properly
  const formatTerm = (coefficient, degree, variable, variables = []) => {
    // If we have the variables array, use it for more accurate display
    if (variables && variables.length > 0) {
      // Separate positive and negative powers for numerator and denominator
      const numeratorVars = variables.filter(v => v.power > 0);
      const denominatorVars = variables.filter(v => v.power < 0);
      
      // Sort variables alphabetically for consistent display
      const sortedNumVars = [...numeratorVars].sort((a, b) => a.variable.localeCompare(b.variable));
      const sortedDenomVars = [...denominatorVars].sort((a, b) => a.variable.localeCompare(b.variable));
      
      // Create React elements for numerator variables with proper superscripts
      const numVarElements = sortedNumVars.map((varInfo, index) => {
        if (varInfo.power === 1) {
          return <React.Fragment key={`num-${index}`}>{varInfo.variable}</React.Fragment>;
        } else {
          return (
            <React.Fragment key={`num-${index}`}>
              {varInfo.variable}<sup>{varInfo.power}</sup>
            </React.Fragment>
          );
        }
      });
      
      // Create React elements for denominator variables with proper superscripts (absolute value of power)
      const denomVarElements = sortedDenomVars.map((varInfo, index) => {
        if (Math.abs(varInfo.power) === 1) {
          return <React.Fragment key={`denom-${index}`}>{varInfo.variable}</React.Fragment>;
        } else {
          return (
            <React.Fragment key={`denom-${index}`}>
              {varInfo.variable}<sup>{Math.abs(varInfo.power)}</sup>
            </React.Fragment>
          );
        }
      });
      
      // Apply coefficient
      let coeffElement;
      if (coefficient === 1) {
        coeffElement = numVarElements.length > 0 ? null : <React.Fragment>1</React.Fragment>;
      } else if (coefficient === -1) {
        coeffElement = <React.Fragment>-</React.Fragment>;
      } else {
        coeffElement = <React.Fragment>{coefficient}</React.Fragment>;
      }
      
      // Combine everything with fraction notation if needed
      if (denominatorVars.length > 0) {
        return (
          <React.Fragment>
            {coeffElement}
            {numVarElements.length > 0 ? numVarElements : <React.Fragment>1</React.Fragment>}
            {denomVarElements.length > 0 && (
              <React.Fragment>
                <span className="inline-block mx-1">/</span>
                {denomVarElements}
              </React.Fragment>
            )}
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment>
            {coeffElement}
            {numVarElements}
          </React.Fragment>
        );
      }
    }
    
    // Fallback to original formatting method if variables array is not available
    if (!variable || degree === 0) {
      return coefficient.toString();
    }

    // Special handling for multi-variable cases like "xy"
    if (variable && variable.length > 1) {
      // For compound variables like "xy", display each character
      const varElements = [];
      
      // Use regex to extract variables with their powers
      const varMatches = [...variable.matchAll(/([a-z])(?:\^(\d+))?/gi)];
      
      if (varMatches.length > 0) {
        for (let i = 0; i < varMatches.length; i++) {
          const [_, varChar, expValue] = varMatches[i];
          if (expValue) {
            varElements.push(
              <React.Fragment key={i}>
                {varChar}<sup>{expValue}</sup>
              </React.Fragment>
            );
          } else {
            varElements.push(<React.Fragment key={i}>{varChar}</React.Fragment>);
          }
        }
      } else {
        // Fallback in case regex doesn't match
        for (let i = 0; i < variable.length; i++) {
          varElements.push(<React.Fragment key={i}>{variable[i]}</React.Fragment>);
        }
      }
      
      if (coefficient === 1) {
        return <React.Fragment>{varElements}</React.Fragment>;
      } else if (coefficient === -1) {
        return <React.Fragment>-{varElements}</React.Fragment>;
      } else {
        return <React.Fragment>{coefficient}{varElements}</React.Fragment>;
      }
    }
    
    // Handle single variable with degree
    else if (degree === 1) {
      if (coefficient === 1) {
        return <React.Fragment>{variable}</React.Fragment>;
      } else if (coefficient === -1) {
        return <React.Fragment>-{variable}</React.Fragment>;
      } else {
        return <React.Fragment>{coefficient}{variable}</React.Fragment>;
      }
    } else {
      if (coefficient === 1) {
        return (
          <React.Fragment>
            {variable}<sup>{degree}</sup>
          </React.Fragment>
        );
      } else if (coefficient === -1) {
        return (
          <React.Fragment>
            -{variable}<sup>{degree}</sup>
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment>
            {coefficient}{variable}<sup>{degree}</sup>
          </React.Fragment>
        );
      }
    }
  };
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsValid(checkValidity(value));
    setError(null);
    setAnalyzed(false);
  };

  const handleFindClick = () => {
    if (!isValid) {
      setError("Please enter a valid polynomial expression");
      setResult(null);
      return;
    }

    const analysisResult = analyzePolynomial(inputValue);
    setResult(analysisResult);
    setAnalyzed(true);
  };

  // No debugging toggle function

  return (
    <div className="w-full max-w-md mx-auto shadow-md bg-white rounded-lg overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Title removed */}
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter a valid polynomial expression:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Example: xy + 3x^2y - 5"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button
              onClick={handleFindClick}
              disabled={!isValid}
              className={`px-3 py-2 ${
                isValid ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              } text-white rounded-md transition-colors`}
            >
              Find
            </button>
          </div>
        </div>

        {analyzed && (
          <div className="bg-gray-50 p-4 rounded-md">
            {error && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="text-sm font-medium text-red-800">
                  Not a valid polynomial
                </p>
              </div>
            )}
            {result && !error && (
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <div className="text-sm font-medium text-green-800">
                    Leading Term:
                    <div className="ml-4 mt-1">
                      {result.variables && result.variables.length > 0 ? (
                        formatTerm(result.leadingCoefficient, result.degree, result.variable, result.variables)
                      ) : (
                        formatTerm(result.leadingCoefficient, result.degree, result.variable)
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-800 mt-2">
                    Leading Coefficient:
                    <div className="ml-4 mt-1">
                      {result.leadingCoefficient}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Debug feature removed */}
      </div>
    </div>
  );
}
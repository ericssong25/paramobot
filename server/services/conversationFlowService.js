const { getDatabase } = require('../database/init');

class ConversationFlowService {
  constructor() {
    this.db = getDatabase();
  }

  // Get all flows
  async getAllFlows() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM conversation_flows ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          console.error('❌ Error getting flows:', err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get flow with all steps and options
  async getFlowWithSteps(flowId) {
    return new Promise((resolve, reject) => {
      // Get flow info
      this.db.get('SELECT * FROM conversation_flows WHERE id = ?', [flowId], (err, flow) => {
        if (err) {
          console.error('❌ Error getting flow:', err);
          reject(err);
          return;
        }

        if (!flow) {
          reject(new Error('Flow not found'));
          return;
        }

        // Get all steps for this flow
        this.db.all('SELECT * FROM flow_steps WHERE flow_id = ? ORDER BY step_number', [flowId], (err, steps) => {
          if (err) {
            console.error('❌ Error getting steps:', err);
            reject(err);
            return;
          }

          // Get all options for all steps
          const stepIds = steps.map(step => step.id);
          
          if (stepIds.length === 0) {
            // No steps exist, return flow with empty steps array
            resolve({
              ...flow,
              steps: []
            });
            return;
          }
          
          const placeholders = stepIds.map(() => '?').join(',');
          
          this.db.all(`SELECT * FROM flow_options WHERE step_id IN (${placeholders}) ORDER BY step_id, option_number`, stepIds, (err, options) => {
            if (err) {
              console.error('❌ Error getting options:', err);
              reject(err);
              return;
            }

            // Organize options by step
            const stepsWithOptions = steps.map(step => ({
              ...step,
              options: options.filter(option => option.step_id === step.id)
            }));

            resolve({
              ...flow,
              steps: stepsWithOptions
            });
          });
        });
      });
    });
  }

  // Create new flow
  async createFlow(flowName) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO conversation_flows (flow_name, is_active) VALUES (?, 1)',
        [flowName],
        function(err) {
          if (err) {
            console.error('❌ Error creating flow:', err);
            reject(err);
            return;
          }
          resolve({ id: this.lastID, flow_name: flowName });
        }
      );
    });
  }

  // Create new step
  async createStep(flowId, stepNumber, parentStepId, questionText) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO flow_steps (flow_id, step_number, parent_step_id, question_text, is_active) VALUES (?, ?, ?, ?, 1)',
        [flowId, stepNumber, parentStepId, questionText],
        function(err) {
          if (err) {
            console.error('❌ Error creating step:', err);
            reject(err);
            return;
          }
          resolve({ id: this.lastID, step_number: stepNumber, question_text: questionText });
        }
      );
    });
  }

  // Create new option
  async createOption(stepId, optionNumber, optionText, responseText, nextStepId, isBackOption = false, isFinalResponse = false) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 [CREATE OPTION] Attempting to create option:`, {
        stepId,
        optionNumber,
        optionText,
        responseText,
        nextStepId,
        isBackOption,
        isFinalResponse
      });

      // First, verify the step exists
      this.db.get('SELECT id, step_number, question_text FROM flow_steps WHERE id = ?', [stepId], (err, step) => {
        if (err) {
          console.error('❌ Error verifying step exists:', err);
          reject(err);
          return;
        }

        if (!step) {
          console.error(`❌ Step with ID ${stepId} not found`);
          reject(new Error(`Step with ID ${stepId} not found`));
          return;
        }

        console.log(`✅ Step verified: Step ${step.step_number} - "${step.question_text}" (ID: ${step.id})`);

        // Now create the option
        this.db.run(
          'INSERT INTO flow_options (step_id, option_number, option_text, response_text, next_step_id, is_back_option, is_final_response, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
          [stepId, optionNumber, optionText, responseText, nextStepId, isBackOption ? 1 : 0, isFinalResponse ? 1 : 0],
          function(err) {
            if (err) {
              console.error('❌ Error creating option:', err);
              reject(err);
              return;
            }
            console.log(`✅ Option created successfully: ID ${this.lastID}, Option ${optionNumber} - "${optionText}"`);
            resolve({ id: this.lastID, option_number: optionNumber, option_text: optionText });
          }
        );
      });
    });
  }

  // Update step
  async updateStep(stepId, questionText) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE flow_steps SET question_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [questionText, stepId],
        (err) => {
          if (err) {
            console.error('❌ Error updating step:', err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // Update option
  async updateOption(optionId, optionText, responseText, nextStepId, isBackOption = false, isFinalResponse = false) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE flow_options SET option_text = ?, response_text = ?, next_step_id = ?, is_back_option = ?, is_final_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [optionText, responseText, nextStepId, isBackOption ? 1 : 0, isFinalResponse ? 1 : 0, optionId],
        (err) => {
          if (err) {
            console.error('❌ Error updating option:', err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // Delete step and all its options
  async deleteStep(stepId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM flow_options WHERE step_id = ?', [stepId], (err) => {
        if (err) {
          console.error('❌ Error deleting step options:', err);
          reject(err);
          return;
        }

        this.db.run('DELETE FROM flow_steps WHERE id = ?', [stepId], (err) => {
          if (err) {
            console.error('❌ Error deleting step:', err);
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  // Delete option
  async deleteOption(optionId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM flow_options WHERE id = ?', [optionId], (err) => {
        if (err) {
          console.error('❌ Error deleting option:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Get current step for a user
  async getCurrentStep(flowId, userId) {
    return new Promise((resolve, reject) => {
      // For now, we'll start with step 1, but this could be enhanced to track user progress
      this.db.get(
        'SELECT * FROM flow_steps WHERE flow_id = ? AND step_number = 1',
        [flowId],
        (err, step) => {
          if (err) {
            console.error('❌ Error getting current step:', err);
            reject(err);
            return;
          }
          resolve(step);
        }
      );
    });
  }

  // Get step by ID
  async getStepById(stepId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM flow_steps WHERE id = ?', [stepId], (err, step) => {
        if (err) {
          console.error('❌ Error getting step:', err);
          reject(err);
          return;
        }
        resolve(step);
      });
    });
  }

  // Get options for a step
  async getStepOptions(stepId) {
    return new Promise((resolve, reject) => {
      console.log(`🔍 [GET STEP OPTIONS] Getting options for step ID: ${stepId}`);
      
      this.db.all(
        'SELECT * FROM flow_options WHERE step_id = ? ORDER BY option_number',
        [stepId],
        (err, options) => {
          if (err) {
            console.error('❌ Error getting step options:', err);
            reject(err);
            return;
          }
          console.log(`✅ Found ${options.length} options for step ${stepId}:`, options.map(opt => `${opt.option_number}. ${opt.option_text}`));
          resolve(options);
        }
      );
    });
  }

  // Get option by ID
  async getOptionById(optionId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM flow_options WHERE id = ?', [optionId], (err, option) => {
        if (err) {
          console.error('❌ Error getting option:', err);
          reject(err);
          return;
        }
        resolve(option);
      });
    });
  }

  // Get parent step
  async getParentStep(stepId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM flow_steps WHERE id = (SELECT parent_step_id FROM flow_steps WHERE id = ?)',
        [stepId],
        (err, step) => {
          if (err) {
            console.error('❌ Error getting parent step:', err);
            reject(err);
            return;
          }
          resolve(step);
        }
      );
    });
  }

  // Get next step number for a flow
  async getNextStepNumber(flowId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT MAX(step_number) as max_step FROM flow_steps WHERE flow_id = ?',
        [flowId],
        (err, result) => {
          if (err) {
            console.error('❌ Error getting next step number:', err);
            reject(err);
            return;
          }
          resolve((result.max_step || 0) + 1);
        }
      );
    });
  }

  // Get next option number for a step
  async getNextOptionNumber(stepId) {
    return new Promise((resolve, reject) => {
      console.log(`🔢 [GET NEXT OPTION NUMBER] Getting next option number for step ID: ${stepId}`);
      
      this.db.get(
        'SELECT MAX(option_number) as max_option FROM flow_options WHERE step_id = ?',
        [stepId],
        (err, result) => {
          if (err) {
            console.error('❌ Error getting next option number:', err);
            reject(err);
            return;
          }
          const nextNumber = (result.max_option || 0) + 1;
          console.log(`✅ Next option number for step ${stepId}: ${nextNumber} (current max: ${result.max_option || 0})`);
          resolve(nextNumber);
        }
      );
    });
  }

  // Update option use count
  async updateOptionUseCount(optionId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE flow_options SET use_count = use_count + 1 WHERE id = ?',
        [optionId],
        (err) => {
          if (err) {
            console.error('❌ Error updating option use count:', err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // Get nested responses for an option
  async getNestedResponses(optionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM flow_nested_responses WHERE option_id = ? AND is_active = 1 ORDER BY created_at',
        [optionId],
        (err, rows) => {
          if (err) {
            console.error('❌ Error getting nested responses:', err);
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  // Add nested response to an option
  async addNestedResponse(optionId, triggerText, responseText) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO flow_nested_responses (option_id, trigger_text, response_text) VALUES (?, ?, ?)',
        [optionId, triggerText, responseText],
        function(err) {
          if (err) {
            console.error('❌ Error adding nested response:', err);
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }

  // Update nested response
  async updateNestedResponse(responseId, triggerText, responseText) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE flow_nested_responses SET trigger_text = ?, response_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [triggerText, responseText, responseId],
        (err) => {
          if (err) {
            console.error('❌ Error updating nested response:', err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // Delete nested response
  async deleteNestedResponse(responseId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM flow_nested_responses WHERE id = ?',
        [responseId],
        (err) => {
          if (err) {
            console.error('❌ Error deleting nested response:', err);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  // Find matching nested response
  async findMatchingNestedResponse(optionId, message) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM flow_nested_responses WHERE option_id = ? AND trigger_text LIKE ? AND is_active = 1',
        [optionId, `%${message.toLowerCase()}%`],
        (err, row) => {
          if (err) {
            console.error('❌ Error finding nested response:', err);
            reject(err);
            return;
          }
          
          if (row) {
            // Update use count
            this.db.run(
              'UPDATE flow_nested_responses SET use_count = use_count + 1 WHERE id = ?',
              [row.id]
            );
          }
          
          resolve(row);
        }
      );
    });
  }

  // Get all options for a flow with step information
  async getAllFlowOptions(flowId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          fo.id as option_id,
          fo.option_number,
          fo.option_text,
          fo.response_text,
          fo.next_step_id,
          fo.is_back_option,
          fo.is_final_response,
          fs.id as step_id,
          fs.step_number,
          fs.question_text,
          fs.parent_step_id
        FROM flow_options fo
        JOIN flow_steps fs ON fo.step_id = fs.id
        WHERE fs.flow_id = ? AND fo.is_active = 1
        ORDER BY fs.step_number, fo.option_number
      `, [flowId], (err, rows) => {
        if (err) {
          console.error('❌ Error getting flow options:', err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get option with full context
  async getOptionWithContext(optionId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          fo.id as option_id,
          fo.option_number,
          fo.option_text,
          fo.response_text,
          fo.next_step_id,
          fo.is_back_option,
          fo.is_final_response,
          fs.id as step_id,
          fs.step_number,
          fs.question_text,
          fs.parent_step_id,
          cf.flow_name
        FROM flow_options fo
        JOIN flow_steps fs ON fo.step_id = fs.id
        JOIN conversation_flows cf ON fs.flow_id = cf.id
        WHERE fo.id = ?
      `, [optionId], (err, row) => {
        if (err) {
          console.error('❌ Error getting option with context:', err);
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // Fix back options that don't have next_step_id configured
  async fixBackOptions(flowId) {
    return new Promise((resolve, reject) => {
      // Get all steps and options in the flow
      this.db.all(`
        SELECT 
          fs.id as step_id,
          fs.step_number,
          fs.parent_step_id,
          fo.id as option_id,
          fo.option_text,
          fo.is_back_option,
          fo.next_step_id
        FROM flow_steps fs
        LEFT JOIN flow_options fo ON fs.id = fo.step_id
        WHERE fs.flow_id = ?
        ORDER BY fs.step_number, fo.option_number
      `, [flowId], (err, rows) => {
        if (err) {
          console.error('❌ Error getting flow data for fixing back options:', err);
          reject(err);
          return;
        }

        // Organize data
        const steps = [];
        const options = [];
        rows.forEach(row => {
          if (!steps.find(s => s.id === row.step_id)) {
            steps.push({
              id: row.step_id,
              step_number: row.step_number,
              parent_step_id: row.parent_step_id
            });
          }
          if (row.option_id) {
            options.push({
              id: row.option_id,
              step_id: row.step_id,
              option_text: row.option_text,
              is_back_option: row.is_back_option,
              next_step_id: row.next_step_id
            });
          }
        });

        let fixedCount = 0;
        const fixPromises = [];

        // For each step, find back options that need fixing
        steps.forEach(step => {
          const backOptions = options.filter(opt => 
            opt.step_id === step.id && 
            opt.is_back_option && 
            !opt.next_step_id
          );

          backOptions.forEach(backOption => {
            // Find which step this current step came from
            let parentStepId = null;

            // Method 1: Use parent_step_id if available
            if (step.parent_step_id) {
              parentStepId = step.parent_step_id;
            } else {
              // Method 2: Find which option leads to this step
              const leadingOption = options.find(opt => opt.next_step_id === step.id);
              if (leadingOption) {
                parentStepId = leadingOption.step_id;
              }
            }

            if (parentStepId) {
              const fixPromise = new Promise((resolveFix) => {
                this.db.run('UPDATE flow_options SET next_step_id = ? WHERE id = ?', [parentStepId, backOption.id], (err) => {
                  if (!err) {
                    console.log(`✅ Fixed back option "${backOption.option_text}" (ID: ${backOption.id}) to point to step ${parentStepId}`);
                    fixedCount++;
                  } else {
                    console.error(`❌ Error fixing back option ${backOption.id}:`, err);
                  }
                  resolveFix();
                });
              });
              fixPromises.push(fixPromise);
            } else {
              console.log(`⚠️ Could not find parent step for back option "${backOption.option_text}" in step ${step.step_number}`);
            }
          });
        });

        Promise.all(fixPromises).then(() => {
          console.log(`✅ Fixed ${fixedCount} back options in flow ${flowId}`);
          resolve(fixedCount);
        });
      });
    });
  }

  // Delete complete flow with all steps and options
  async deleteFlow(flowId) {
    return new Promise((resolve, reject) => {
      console.log(`🗑️ Starting deletion of flow ${flowId}...`);
      
      // First, check if the flow exists
      this.db.get('SELECT id, flow_name FROM conversation_flows WHERE id = ?', [flowId], (err, flow) => {
        if (err) {
          console.error('❌ Error checking if flow exists:', err);
          reject(err);
          return;
        }

        if (!flow) {
          console.error(`❌ Flow with ID ${flowId} not found`);
          reject(new Error(`Flow with ID ${flowId} not found`));
          return;
        }

        console.log(`✅ Found flow: "${flow.flow_name}" (ID: ${flow.id})`);
      
        // Get all step IDs for this flow
        this.db.all('SELECT id FROM flow_steps WHERE flow_id = ?', [flowId], (err, steps) => {
          if (err) {
            console.error('❌ Error getting steps for deletion:', err);
            reject(err);
            return;
          }

          const stepIds = steps.map(step => step.id);
          console.log(`📋 Found ${stepIds.length} steps to delete in flow ${flowId}`);

          if (stepIds.length === 0) {
            // No steps to delete, just delete the flow
            this.db.run('DELETE FROM conversation_flows WHERE id = ?', [flowId], (err) => {
              if (err) {
                console.error('❌ Error deleting flow:', err);
                reject(err);
                return;
              }
              console.log(`✅ Flow ${flowId} deleted successfully (no steps found)`);
              resolve();
            });
            return;
          }

          // Delete all options for all steps in this flow
          const placeholders = stepIds.map(() => '?').join(',');
          this.db.run(`DELETE FROM flow_options WHERE step_id IN (${placeholders})`, stepIds, (err) => {
            if (err) {
              console.error('❌ Error deleting flow options:', err);
              reject(err);
              return;
            }

            console.log(`✅ Deleted all options for flow ${flowId}`);

            // Delete all steps in this flow
            this.db.run(`DELETE FROM flow_steps WHERE id IN (${placeholders})`, stepIds, (err) => {
              if (err) {
                console.error('❌ Error deleting flow steps:', err);
                reject(err);
                return;
              }

              console.log(`✅ Deleted all steps for flow ${flowId}`);

              // Finally, delete the flow itself
              this.db.run('DELETE FROM conversation_flows WHERE id = ?', [flowId], (err) => {
                if (err) {
                  console.error('❌ Error deleting flow:', err);
                  reject(err);
                  return;
                }

                console.log(`✅ Flow ${flowId} deleted successfully with all its steps and options`);
                resolve();
              });
            });
          });
        });
      });
    });
  }
}

module.exports = ConversationFlowService;

export interface TreeNode {
  name: string;
  deadline?: string;
  branch?: string;
  zone?: string;
  children: TreeNode[];
}

export interface ParsedInput {
  title: string;
  tree: TreeNode[];
}

export function parseInput(input: string): ParsedInput {
  const originalInput = input.trim();
  let cleanedInput = originalInput;
  
  let title = 'Schema';
  
  const todoTitleMatch = cleanedInput.match(/^(todo|tasks?)\s+(?:list\s+for\s+)?(.+?)(?:\s*:|\s*$)/i);
  if (todoTitleMatch) {
    title = `TODO ${todoTitleMatch[2].trim()}`;
    cleanedInput = cleanedInput.replace(/^(todo|tasks?)\s+(?:list\s+for\s+)?[^:]+:\s*/i, '');
  } else {
    const archTitleMatch = cleanedInput.match(/^(architecture|structure|kubernetes|k8s|yandex|cloud)\s+(?:production\s+)?(.+?)(?:\s*:|\s*$)/i);
    if (archTitleMatch) {
      const prefix = archTitleMatch[1].charAt(0).toUpperCase() + archTitleMatch[1].slice(1);
      title = `${prefix} ${archTitleMatch[2].trim()}`;
      cleanedInput = cleanedInput.replace(/^(architecture|structure|kubernetes|k8s|yandex|cloud)\s+(?:production\s+)?[^:]+:\s*/i, '');
    } else {
      const colonMatch = cleanedInput.match(/^(.+?):\s*(.+)$/);
      if (colonMatch) {
        title = colonMatch[1].trim();
        cleanedInput = colonMatch[2].trim();
      }
    }
  }
  
  cleanedInput = cleanedInput.replace(/^(todo|tasks?)\s*:?\s*/i, '');
  cleanedInput = cleanedInput.replace(/^(architecture|structure)\s*/i, '');
  cleanedInput = cleanedInput.replace(/^(kubernetes\s+cluster\s+with|kubernetes\s+cluster|kubernetes|k8s)\s*/i, '');
  
  cleanedInput = cleanedInput.trim();
  
  if (!cleanedInput || cleanedInput.length === 0) {
    return {
      title: originalInput || 'Schema',
      tree: [],
    };
  }
  
  const parts = cleanedInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
  
  const tree: TreeNode[] = [];
  const pathMap: Record<string, TreeNode> = {};
  const branchNodes: Record<string, TreeNode> = {};
  
  for (const part of parts) {
    const metadata = extractMetadata(part);
    const name = extractNodeName(part);
    
    if (part.includes('/')) {
      const pathParts = part.split('/').map(p => p.trim()).filter(p => p.length > 0);
      if (pathParts.length > 0) {
        let currentPath = '';
        let parentNode: TreeNode | null = null;
        
        pathParts.forEach((pathPart, index) => {
          const cleanPart = extractNodeName(pathPart);
          const fullPath = currentPath ? `${currentPath}/${cleanPart}` : cleanPart;
          
          if (!pathMap[fullPath]) {
            const newNode: TreeNode = {
              name: cleanPart,
              children: [],
            };
            
            if (index === pathParts.length - 1) {
              if (metadata.deadline) newNode.deadline = metadata.deadline;
              if (metadata.branch) newNode.branch = metadata.branch;
              if (metadata.zone) newNode.zone = metadata.zone;
            }
            
            pathMap[fullPath] = newNode;
            
            if (parentNode) {
              parentNode.children.push(newNode);
            } else {
              tree.push(newNode);
            }
            
            parentNode = newNode;
          } else {
            parentNode = pathMap[fullPath];
          }
          
          currentPath = fullPath;
        });
      }
    } else {
      const newNode: TreeNode = {
        name,
        deadline: metadata.deadline,
        branch: metadata.branch,
        zone: metadata.zone,
        children: [],
      };
      
      if (metadata.branch) {
        if (!branchNodes[metadata.branch]) {
          const branchNode: TreeNode = {
            name: `Branch: ${metadata.branch}`,
            children: [],
          };
          tree.push(branchNode);
          branchNodes[metadata.branch] = branchNode;
        }
        branchNodes[metadata.branch].children.push(newNode);
      } else {
        tree.push(newNode);
      }
    }
  }
  
  return { title, tree };
}

function extractNodeName(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/\[deadline:\s*[^\]]+\]|deadline:\s*[^\s,]+/gi, '').trim();
  cleaned = cleaned.replace(/\[branch:\s*[^\]]+\]|branch:\s*[^\s,]+/gi, '').trim();
  cleaned = cleaned.replace(/\[zone:\s*[^\]]+\]|zone:\s*[^\s,]+/gi, '').trim();
  cleaned = cleaned.replace(/^\[|\]$/g, '').replace(/,\s*$/, '').trim();
  return cleaned;
}

function extractMetadata(text: string): { deadline?: string; branch?: string; zone?: string } {
  const metadata: { deadline?: string; branch?: string; zone?: string } = {};
  
  const deadlineMatch = text.match(/\[deadline:\s*([^\]]+)\]|deadline:\s*([^\s,]+)/i);
  if (deadlineMatch) {
    metadata.deadline = (deadlineMatch[1] || deadlineMatch[2]).trim();
  }
  
  const branchMatch = text.match(/\[branch:\s*([^\]]+)\]|branch:\s*([^\s,]+)/i);
  if (branchMatch) {
    metadata.branch = (branchMatch[1] || branchMatch[2]).trim();
  }
  
  const zoneMatch = text.match(/\[zone:\s*([^\]]+)\]|zone:\s*([^\s,]+)/i);
  if (zoneMatch) {
    metadata.zone = (zoneMatch[1] || zoneMatch[2]).trim();
  }
  
  return metadata;
}

export function generateSchema(parsed: ParsedInput): string[] {
  if (parsed.tree.length === 0) {
    return [
      `┌─ ${parsed.title} ────────────────────┐`,
      '│ No items                   │',
      '└────────────────────────────┘',
    ];
  }
  
  const lines: string[] = [];
  const maxWidth = Math.max(parsed.title.length + 4, calculateMaxWidth(parsed.tree, 0));
  const width = Math.min(maxWidth + 10, 75);
  
  const titlePadding = width - parsed.title.length - 4;
  lines.push(`┌─ ${parsed.title}${' '.repeat(Math.max(0, titlePadding))}┐`);
  lines.push(`│${' '.repeat(width - 2)}│`);
  
  parsed.tree.forEach((node, index) => {
    const isLast = index === parsed.tree.length - 1;
    const nodeLines = generateTreeNode(node, '│ ', isLast, width);
    lines.push(...nodeLines);
  });
  
  lines.push(`│${' '.repeat(width - 2)}│`);
  lines.push('└' + '─'.repeat(width - 2) + '┘');
  
  return lines;
}

function calculateMaxWidth(nodes: TreeNode[], depth: number): number {
  let maxWidth = 20;
  
  nodes.forEach(node => {
    let nodeWidth = node.name.length;
    if (node.deadline) nodeWidth += node.deadline.length + 3;
    if (node.branch && !node.name.startsWith('Branch:')) nodeWidth += node.branch.length + 3;
    if (node.zone && !node.name.startsWith('Zone:')) nodeWidth += node.zone.length + 3;
    
    nodeWidth += depth * 4;
    
    if (nodeWidth > maxWidth) {
      maxWidth = nodeWidth;
    }
    
    if (node.children.length > 0) {
      const childWidth = calculateMaxWidth(node.children, depth + 1);
      if (childWidth > maxWidth) {
        maxWidth = childWidth;
      }
    }
  });
  
  return maxWidth;
}

function generateTreeNode(node: TreeNode, prefix: string, isLast: boolean, width: number): string[] {
  const lines: string[] = [];
  
  let nodeText = node.name;
  if (node.deadline) {
    nodeText += ` [${node.deadline}]`;
  }
  if (node.branch && !node.name.startsWith('Branch:')) {
    nodeText += ` (${node.branch})`;
  }
  if (node.zone && !node.name.startsWith('Zone:')) {
    nodeText += ` [zone: ${node.zone}]`;
  }
  
  const connector = isLast ? '└──' : '├──';
  const spacing = isLast ? '    ' : '│   ';
  
  const borderPadding = 2;
  const prefixLen = prefix.length;
  const connectorLen = connector.length + 1;
  const availableWidth = width - prefixLen - connectorLen - borderPadding;
  
  let displayText = nodeText;
  if (displayText.length > availableWidth) {
    displayText = displayText.substring(0, availableWidth - 3) + '...';
  } else {
    displayText = displayText.padEnd(availableWidth);
  }
  
  lines.push(`${prefix}${connector} ${displayText} │`);
  
  if (node.children.length > 0) {
    const childPrefixBase = prefix.replace(/│ $/, spacing);
    node.children.forEach((child, index) => {
      const isChildLast = index === node.children.length - 1;
      const childPrefix = isLast
        ? childPrefixBase.replace(/│/g, ' ')
        : childPrefixBase;
      const childLines = generateTreeNode(child, childPrefix, isChildLast, width);
      lines.push(...childLines);
    });
  }
  
  return lines;
}



-- Drop the constraint that doesn't include type (problematic)
ALTER TABLE personal_categories DROP CONSTRAINT IF EXISTS personal_categories_user_id_name_key;

-- Create new constraint that includes type (income/expense can have same name)
ALTER TABLE personal_categories ADD CONSTRAINT personal_categories_user_id_name_type_key UNIQUE (user_id, name, type);

-- Create default categories for user andylima2021@outlook.com
INSERT INTO personal_categories (user_id, name, color, type, active)
SELECT 
  'e39a21fc-1dfa-4d81-96a8-e85b0e4e6b1e',
  name,
  color,
  type,
  true
FROM (
  VALUES 
    -- Expense categories
    ('Alimentação', '#EF4444', 'expense'),
    ('Transporte', '#3B82F6', 'expense'),
    ('Moradia', '#8B5CF6', 'expense'),
    ('Saúde', '#10B981', 'expense'),
    ('Educação', '#F59E0B', 'expense'),
    ('Lazer', '#EC4899', 'expense'),
    ('Vestuário', '#6366F1', 'expense'),
    ('Serviços', '#14B8A6', 'expense'),
    ('Outros', '#6B7280', 'expense'),
    -- Income categories
    ('Salário', '#22C55E', 'income'),
    ('Freelance', '#3B82F6', 'income'),
    ('Investimentos', '#8B5CF6', 'income'),
    ('Outros', '#6B7280', 'income')
) AS defaults(name, color, type)
ON CONFLICT (user_id, name, type) DO NOTHING;
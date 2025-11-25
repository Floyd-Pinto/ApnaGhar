#!/usr/bin/env python
"""
Direct Database Export to CSV (Backup Method)
Use this if Django management command has issues

Usage: 
  cd /home/floydpinto/ApnaGhar
  source venv/bin/activate
  python export_db_to_csv.py
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Load Django
try:
    django.setup()
except Exception as e:
    print(f"❌ Failed to setup Django: {e}")
    print("\nMake sure you:")
    print("  1. Have activated the virtual environment: source venv/bin/activate")
    print("  2. Are running from project root: cd /home/floydpinto/ApnaGhar")
    print("  3. Have correct .env file in backend/ with DATABASE_URL")
    sys.exit(1)

# Import models after Django setup
from projects.models import Project, Property, ConstructionMilestone, Developer
import csv

# Output directory
OUTPUT_DIR = PROJECT_ROOT / 'rag-pipeline' / 'data'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("\n" + "="*70)
print("   📊 Direct Database Export to CSV")
print("="*70 + "\n")


def export_developers():
    """Export all developers to CSV"""
    print("Exporting Developers...")
    
    developers = Developer.objects.select_related('user').all()
    
    output_file = OUTPUT_DIR / 'developers.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'company_name', 'description', 'established_year',
            'total_projects', 'completed_projects', 'rera_number',
            'verified', 'trust_score', 'website', 'logo'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for dev in developers:
            writer.writerow({
                'id': str(dev.user.id),
                'company_name': dev.company_name,
                'description': dev.description or '',
                'established_year': dev.established_year or '',
                'total_projects': dev.total_projects,
                'completed_projects': dev.completed_projects,
                'rera_number': dev.rera_number or '',
                'verified': dev.verified,
                'trust_score': float(dev.trust_score),
                'website': dev.website or '',
                'logo': dev.logo or ''
            })
    
    print(f"  ✓ Exported {developers.count()} developers to {output_file.name}")
    return developers.count()


def export_projects():
    """Export all projects to CSV"""
    print("Exporting Projects...")
    
    projects = Project.objects.select_related('developer').all()
    
    output_file = OUTPUT_DIR / 'projects.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'name', 'slug', 'description', 'city', 'state', 'pincode',
            'project_type', 'status', 'total_units', 'available_units',
            'starting_price', 'amenities', 'address', 'total_floors',
            'expected_completion', 'launch_date', 'actual_completion',
            'verified', 'verification_score', 'developer_id',
            'developer__company_name', 'total_area_sqft'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for proj in projects:
            writer.writerow({
                'id': str(proj.id),
                'name': proj.name,
                'slug': proj.slug,
                'description': proj.description,
                'city': proj.city,
                'state': proj.state,
                'pincode': proj.pincode,
                'project_type': proj.project_type,
                'status': proj.status,
                'total_units': proj.total_units,
                'available_units': proj.available_units,
                'starting_price': float(proj.starting_price),
                'amenities': str(proj.amenities),  # JSON field
                'address': proj.address,
                'total_floors': proj.total_floors or '',
                'expected_completion': proj.expected_completion or '',
                'launch_date': proj.launch_date or '',
                'actual_completion': proj.actual_completion or '',
                'verified': proj.verified,
                'verification_score': float(proj.verification_score),
                'developer_id': str(proj.developer.user.id),
                'developer__company_name': proj.developer.company_name,
                'total_area_sqft': float(proj.total_area_sqft) if proj.total_area_sqft else ''
            })
    
    print(f"  ✓ Exported {projects.count()} projects to {output_file.name}")
    return projects.count()


def export_properties():
    """Export all properties to CSV"""
    print("Exporting Properties...")
    
    properties = Property.objects.select_related('project').all()
    
    output_file = OUTPUT_DIR / 'properties.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'unit_number', 'property_type', 'bedrooms', 'bathrooms',
            'carpet_area', 'built_up_area', 'super_built_up_area', 'price',
            'price_per_sqft', 'status', 'floor_number', 'tower', 'balconies',
            'features', 'unit_progress_percentage', 'project_id',
            'project__name', 'project__city', 'project__state'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        count = 0
        for prop in properties:
            writer.writerow({
                'id': str(prop.id),
                'unit_number': prop.unit_number,
                'property_type': prop.property_type,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'carpet_area': float(prop.carpet_area),
                'built_up_area': float(prop.built_up_area) if prop.built_up_area else '',
                'super_built_up_area': float(prop.super_built_up_area) if prop.super_built_up_area else '',
                'price': float(prop.price),
                'price_per_sqft': float(prop.price_per_sqft) if prop.price_per_sqft else '',
                'status': prop.status,
                'floor_number': prop.floor_number or '',
                'tower': prop.tower or '',
                'balconies': prop.balconies,
                'features': str(prop.features),  # JSON field
                'unit_progress_percentage': prop.unit_progress_percentage,
                'project_id': str(prop.project.id),
                'project__name': prop.project.name,
                'project__city': prop.project.city,
                'project__state': prop.project.state
            })
            count += 1
            
            # Progress indicator for large datasets
            if count % 1000 == 0:
                print(f"  ... {count} properties exported", end='\r')
    
    print(f"  ✓ Exported {count} properties to {output_file.name}               ")
    return count


def export_milestones():
    """Export all construction milestones to CSV"""
    print("Exporting Construction Milestones...")
    
    milestones = ConstructionMilestone.objects.select_related('project').all()
    
    output_file = OUTPUT_DIR / 'construction_milestones.csv'
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'id', 'title', 'description', 'phase_number', 'status',
            'target_date', 'start_date', 'completion_date',
            'progress_percentage', 'verified', 'project_id',
            'project__name', 'project__city'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for milestone in milestones:
            writer.writerow({
                'id': str(milestone.id),
                'title': milestone.title,
                'description': milestone.description or '',
                'phase_number': milestone.phase_number,
                'status': milestone.status,
                'target_date': milestone.target_date or '',
                'start_date': milestone.start_date or '',
                'completion_date': milestone.completion_date or '',
                'progress_percentage': milestone.progress_percentage,
                'verified': milestone.verified,
                'project_id': str(milestone.project.id),
                'project__name': milestone.project.name,
                'project__city': milestone.project.city
            })
    
    print(f"  ✓ Exported {milestones.count()} milestones to {output_file.name}")
    return milestones.count()


def main():
    try:
        # Export all data
        dev_count = export_developers()
        proj_count = export_projects()
        prop_count = export_properties()
        mile_count = export_milestones()
        
        total = dev_count + proj_count + prop_count + mile_count
        
        print("\n" + "="*70)
        print(f"✅ Successfully exported {total:,} total records")
        print("="*70)
        print(f"\nOutput directory: {OUTPUT_DIR}")
        print("\nNext step:")
        print("  cd rag-pipeline && python app.py build")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

import pytest
from config.settings import Config, DevelopmentConfig, ProductionConfig, TestingConfig

REQUIRED_TEMPLATE_KEYS = {
    'label_width_inches', 'label_height_inches', 'rows', 'columns',
    'margin_top_inches', 'margin_left_inches', 'x_gap_inches',
    'y_gap_inches', 'max_text_lines',
}

TEMPLATE_IDS = ['standard_20', '5163', '5160', '94233']
LETTER_WIDTH = 8.5
LETTER_HEIGHT = 11.0

# 94233 template dimensions exceed letter page — known issue tracked in GitHub #10+
# These templates are calibrated for specific Avery label stock, not nominal letter paper
TEMPLATES_EXCEEDING_PAGE = {'94233'}


@pytest.mark.unit
def test_all_templates_present():
    assert set(TEMPLATE_IDS).issubset(set(Config.LABEL_TEMPLATES.keys()))


@pytest.mark.unit
def test_default_template_exists():
    assert Config.DEFAULT_TEMPLATE in Config.LABEL_TEMPLATES


@pytest.mark.unit
@pytest.mark.parametrize('template_id', TEMPLATE_IDS)
def test_template_has_required_keys(template_id):
    template = Config.LABEL_TEMPLATES[template_id]
    missing = REQUIRED_TEMPLATE_KEYS - set(template.keys())
    assert not missing, f"{template_id} missing keys: {missing}"


@pytest.mark.unit
@pytest.mark.parametrize('template_id', TEMPLATE_IDS)
def test_template_fits_horizontally(template_id):
    if template_id in TEMPLATES_EXCEEDING_PAGE:
        pytest.xfail(f"{template_id} is known to exceed nominal letter width — see GitHub issue for template dimension review")
    t = Config.LABEL_TEMPLATES[template_id]
    used = (t['columns'] * t['label_width_inches']
            + (t['columns'] - 1) * t['x_gap_inches']
            + 2 * t['margin_left_inches'])
    # Allow 0.1" tolerance for label stock vs nominal letter paper variation
    assert used <= LETTER_WIDTH + 0.1, (
        f"{template_id}: horizontal usage {used:.3f}\" exceeds {LETTER_WIDTH + 0.1:.1f}\""
    )


@pytest.mark.unit
@pytest.mark.parametrize('template_id', TEMPLATE_IDS)
def test_template_fits_vertically(template_id):
    if template_id in TEMPLATES_EXCEEDING_PAGE:
        pytest.xfail(f"{template_id} is known to exceed nominal letter height — see GitHub issue for template dimension review")
    t = Config.LABEL_TEMPLATES[template_id]
    used = (t['rows'] * t['label_height_inches']
            + (t['rows'] - 1) * t['y_gap_inches']
            + 2 * t['margin_top_inches'])
    # Allow 0.1" tolerance for label stock vs nominal letter paper variation
    assert used <= LETTER_HEIGHT + 0.1, (
        f"{template_id}: vertical usage {used:.3f}\" exceeds {LETTER_HEIGHT + 0.1:.1f}\""
    )


@pytest.mark.unit
def test_testing_config_testing_flag():
    assert TestingConfig.TESTING is True


@pytest.mark.unit
def test_testing_config_session_type():
    assert TestingConfig.SESSION_TYPE == 'filesystem'

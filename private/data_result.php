<?php
class DataResult {
    public $function = null;
    public $status = null;
    public $data_item = null;
    public $values = Array();
	public $errors = Array();

    public function __construct( $data_function )
    {
        $this->function = $data_function;
    }
}
?>
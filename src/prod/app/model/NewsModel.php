<?php

/**
 * @author Top - Chrudos Vorlicek <chrudos.vorlicek@gmail.com>
 */
class NewsModel extends BaseModel
{
	/**
	 * Base filter on table
	 * @return \Nette\Database\Table\Selection
	 */
	public function baseFilter()
	{
		return parent::baseFilter();
	}
}
